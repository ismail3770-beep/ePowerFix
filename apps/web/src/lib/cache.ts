/**
 * Redis-backed caching layer with in-memory fallback for development.
 *
 * Strategy:
 *   - Production: Uses Upstash Redis (serverless, HTTP-based)
 *   - Development: Falls back to in-memory Map if UPSTASH_REDIS_REST_URL not set
 *
 * Cache strategy:
 *   - Settings, categories, brands -> cached 5 min (TTL)
 *   - Product lists -> cached 2 min (TTL)
 *   - Single product/kit -> cached 1 min (TTL)
 *   - User sessions -> NOT cached (JWT is stateless)
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
 */

import { Redis } from '@upstash/redis'

// --- Types -------------------------------------------------------------------

interface CacheEntry {
  value: unknown
  expiresAt: number
}

// --- Redis Client ------------------------------------------------------------

let redis: Redis | null = null

function getRedis(): Redis | null {
  // Automated tests must never read, flush, or mutate a configured shared Redis.
  // This guard intentionally runs before the memoized-client check.
  if (process.env.NODE_ENV === 'test') {return null}
  if (redis) {return redis}

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[cache] UPSTASH_REDIS_REST_URL/TOKEN not set - cache disabled in production!')
    }
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

// --- In-Memory Fallback Store (dev only) -------------------------------------

const memoryStore = new Map<string, CacheEntry>()

if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore) {
      if (now >= entry.expiresAt) {
        memoryStore.delete(key)
      }
    }
  }, 2 * 60 * 1000)
  cleanupTimer.unref?.()
}

async function memoryGetOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const entry = memoryStore.get(key)
  if (entry && Date.now() < entry.expiresAt) {
    return entry.value as T
  }
  if (entry) {memoryStore.delete(key)}
  const fresh = await fetcher()
  memoryStore.set(key, { value: fresh, expiresAt: Date.now() + ttlSeconds * 1000 })
  return fresh
}

async function memoryGet<T>(key: string): Promise<T | null> {
  const entry = memoryStore.get(key)
  if (entry && Date.now() < entry.expiresAt) {
    return entry.value as T
  }
  if (entry) {memoryStore.delete(key)}
  return null
}

async function memorySet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  memoryStore.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}

async function memoryDel(key: string): Promise<void> {
  memoryStore.delete(key)
}

async function memoryInvalidatePattern(pattern: string): Promise<void> {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
  for (const key of memoryStore.keys()) {
    if (regex.test(key)) {
      memoryStore.delete(key)
    }
  }
}

async function memoryFlush(): Promise<void> {
  memoryStore.clear()
}

// --- Cache API ---------------------------------------------------------------

function isRedisAvailable(): boolean {
  return getRedis() !== null
}

function registryPrefixForKey(key: string): string | null {
  const separatorIndex = key.indexOf(':')
  return separatorIndex < 0 ? null : key.slice(0, separatorIndex + 1)
}

async function registerRedisKey(client: Redis, key: string): Promise<void> {
  const prefix = registryPrefixForKey(key)
  if (!prefix) {return}
  const registryKey = `cache:registry:${prefix}`
  await client.sadd(registryKey, key)
  await client.expire(registryKey, 86400)
}

export const cache = {
  /**
   * Get a value from cache, or compute and store it.
   * TTL is in seconds.
   */
  async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const client = getRedis()
    if (client) {
      const cached = await client.get(key)
      if (cached !== null) {
        return cached as T
      }
      const fresh = await fetcher()
      await client.set(key, fresh, { ex: ttlSeconds })
      await registerRedisKey(client, key)
      return fresh
    }
    // Fallback to in-memory (dev only)
    return memoryGetOrSet(key, ttlSeconds, fetcher)
  },

  /**
   * Get a value from cache (without computing).
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getRedis()
    if (client) {
      const val = await client.get(key)
      return (val as T | null) ?? null
    }
    return memoryGet(key)
  },

  /**
   * Set a value in cache with TTL (seconds).
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const client = getRedis()
    if (client) {
      await client.set(key, value, { ex: ttlSeconds })
      await registerRedisKey(client, key)
      return
    }
    await memorySet(key, value, ttlSeconds)
  },

  /**
   * Delete a single key.
   */
  async del(key: string): Promise<void> {
    const client = getRedis()
    if (client) {
      await client.del(key)
      return
    }
    await memoryDel(key)
  },

  /**
   * Delete all keys matching a pattern (e.g., 'products:*').
   * Note: Upstash Redis doesn't support SCAN, so pattern invalidation
   * requires tracking keys or using a different strategy.
   * For now, we use a prefix-based approach with a key registry.
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const client = getRedis()
    if (client) {
      // For Upstash, we need to track keys. Use a simple prefix scan via a registry key.
      // This is a best-effort approach - for production, consider using Redis keyspace notifications
      // or a dedicated key registry.
      const prefix = pattern.replace(/\*$/, '')
      const registryKey = `cache:registry:${prefix}`
      const keys = (await client.smembers(registryKey)) as string[] | null

      if (keys?.length) {
        await client.del(...keys)
        await client.del(registryKey)
      }
      return
    }
    await memoryInvalidatePattern(pattern)
  },

  /**
   * Register a key for pattern-based invalidation (Redis only).
   * Call this after setting a key that should be invalidatable by pattern.
   */
  async registerKey(patternPrefix: string, key: string): Promise<void> {
    const client = getRedis()
    if (!client) {return}
    const registryKey = `cache:registry:${patternPrefix}`
    await client.sadd(registryKey, key)
    // Registry expires after 24h
    await client.expire(registryKey, 86400)
  },

  /**
   * Clear all cache (use with caution -- mainly for testing).
   */
  async flush(): Promise<void> {
    const client = getRedis()
    if (client) {
      await client.flushall()
      return
    }
    await memoryFlush()
  },

  /**
   * Check if the cache backend is connected.
   */
  isRedisConnected(): boolean {
    return isRedisAvailable()
  },
}

// --- Cache Key Builders ------------------------------------------------------
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