/**
 * Redis caching layer for frequently accessed data.
 *
 * Uses ioredis with a graceful in-memory fallback when Redis is not
 * available (e.g., local dev, CI). This means the app works WITHOUT
 * Redis configured, but gets caching benefits when it is.
 *
 * Cache strategy:
 *   - Settings, categories, brands → cached 5 min (TTL)
 *   - Product lists → cached 2 min (TTL)
 *   - Single product/kit → cached 1 min (TTL)
 *   - User sessions → NOT cached (JWT is stateless)
 *
 * Invalidation:
 *   - On any PUT/POST/DELETE to admin routes, call:
 *       await cache.invalidatePattern('products:*')
 *   - Settings updates invalidate 'settings:*'
 *
 * Usage:
 *   import { cache } from '@/lib/cache'
 *
 *   // Read-through cache
 *   const settings = await cache.getOrSet('settings:default', 300, async () => {
 *     return await db.siteSettings.findUnique({ where: { id: 'default' } })
 *   })
 *
 *   // Manual invalidation
 *   await cache.del('settings:default')
 *   await cache.invalidatePattern('products:*')
 *
 * Setup:
 *   1. bun add ioredis
 *   2. Add to .env: REDIS_URL=redis://localhost:6379
 *   3. (optional) If REDIS_URL is not set, falls back to in-memory Map
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface CacheEntry {
  value: unknown
  expiresAt: number
}

// ─── Redis Connection (lazy) ──────────────────────────────────────────────────

let redis: any = null
let redisConnected = false

async function getRedis() {
  if (redis) return redis

  const REDIS_URL = process.env.REDIS_URL
  if (!REDIS_URL) return null

  try {
    const IORedis = (await import('ioredis')).default
    redis = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 100, 1000),
      lazyConnect: true,
    })

    redis.on('connect', () => {
      redisConnected = true
      console.log('[cache] Redis connected')
    })

    redis.on('error', (err: Error) => {
      console.warn('[cache] Redis error:', err.message)
      redisConnected = false
    })

    redis.on('close', () => {
      redisConnected = false
    })

    await redis.connect()
    return redis
  } catch (err: any) {
    console.warn('[cache] Redis unavailable, falling back to in-memory:', err?.message)
    redis = null
    return null
  }
}

// ─── In-Memory Fallback ───────────────────────────────────────────────────────

const memoryStore = new Map<string, CacheEntry>()

// Cleanup expired entries every 2 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore) {
      if (now > entry.expiresAt) {
        memoryStore.delete(key)
      }
    }
  }, 2 * 60 * 1000)
}

// ─── Cache API ────────────────────────────────────────────────────────────────

export const cache = {
  /**
   * Get a value from cache, or compute and store it.
   * TTL is in seconds.
   *
   * Usage:
   *   const data = await cache.getOrSet('products:list', 120, async () => {
   *     return await db.product.findMany()
   *   })
   */
  async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    // Try Redis first
    const r = await getRedis()
    if (r && redisConnected) {
      try {
        const cached = await r.get(key)
        if (cached) {
          return JSON.parse(cached) as T
        }
        const fresh = await fetcher()
        await r.setex(key, ttlSeconds, JSON.stringify(fresh))
        return fresh
      } catch {
        // Redis error — fall through to memory cache
      }
    }

    // Fallback: in-memory cache
    const memEntry = memoryStore.get(key)
    if (memEntry && Date.now() < memEntry.expiresAt) {
      return memEntry.value as T
    }

    const fresh = await fetcher()
    memoryStore.set(key, {
      value: fresh,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
    return fresh
  },

  /**
   * Get a value from cache (without computing).
   */
  async get<T>(key: string): Promise<T | null> {
    const r = await getRedis()
    if (r && redisConnected) {
      try {
        const cached = await r.get(key)
        return cached ? (JSON.parse(cached) as T) : null
      } catch {
        // fall through
      }
    }

    const memEntry = memoryStore.get(key)
    if (memEntry && Date.now() < memEntry.expiresAt) {
      return memEntry.value as T
    }
    return null
  },

  /**
   * Set a value in cache with TTL (seconds).
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const r = await getRedis()
    if (r && redisConnected) {
      try {
        await r.setex(key, ttlSeconds, JSON.stringify(value))
        return
      } catch {
        // fall through
      }
    }
    memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  },

  /**
   * Delete a single key.
   */
  async del(key: string): Promise<void> {
    const r = await getRedis()
    if (r && redisConnected) {
      try {
        await r.del(key)
      } catch {
        // ignore
      }
    }
    memoryStore.delete(key)
  },

  /**
   * Delete all keys matching a pattern (e.g., 'products:*').
   * Uses SCAN in Redis to avoid blocking.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const r = await getRedis()
    if (r && redisConnected) {
      try {
        let cursor = '0'
        do {
          const [nextCursor, keys] = await r.scan(
            cursor, 'MATCH', pattern, 'COUNT', 100
          )
          cursor = nextCursor
          if (keys.length > 0) {
            await r.del(...keys)
          }
        } while (cursor !== '0')
        return
      } catch {
        // fall through
      }
    }

    // In-memory: iterate and delete matching keys
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    for (const key of memoryStore.keys()) {
      if (regex.test(key)) {
        memoryStore.delete(key)
      }
    }
  },

  /**
   * Clear all cache (use with caution — mainly for testing).
   */
  async flush(): Promise<void> {
    const r = await getRedis()
    if (r && redisConnected) {
      try {
        await r.flushdb()
      } catch {
        // ignore
      }
    }
    memoryStore.clear()
  },

  /**
   * Check if Redis is connected.
   */
  isRedisConnected(): boolean {
    return redisConnected
  },
}

// ─── Cache Key Builders ──────────────────────────────────────────────────────
// Centralized key patterns for consistent invalidation.

export const cacheKeys = {
  settings: () => 'settings:default',
  categories: () => 'product-categories:all',
  brands: () => 'brands:all',
  services: () => 'services:active',
  banners: (type?: string) => `banners:${type || 'all'}`,
  products: (page: number, limit: number, search?: string) =>
    `products:list:p${page}:l${limit}:${search || 'none'}`,
  product: (id: string) => `products:single:${id}`,
  projectKits: () => 'project-kits:active',
  blogPosts: (limit: number) => `blog:published:l${limit}`,
}
