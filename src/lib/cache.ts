/**
 * In-memory caching layer for frequently accessed data.
 *
 * Strategy: simple TTL-based Map cache. No external services (Redis, etc.)
 * are required, keeping the dev/prod stack simple and dependency-free.
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

// --- Types -------------------------------------------------------------------

interface CacheEntry {
  value: unknown
  expiresAt: number
}

// --- In-Memory Store ---------------------------------------------------------

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

// --- Cache API ---------------------------------------------------------------

export const cache = {
  /**
   * Get a value from cache, or compute and store it.
   * TTL is in seconds.
   */
  async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
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
    memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  },

  /**
   * Delete a single key.
   */
  async del(key: string): Promise<void> {
    memoryStore.delete(key)
  },

  /**
   * Delete all keys matching a pattern (e.g., 'products:*').
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    for (const key of memoryStore.keys()) {
      if (regex.test(key)) {
        memoryStore.delete(key)
      }
    }
  },

  /**
   * Clear all cache (use with caution -- mainly for testing).
   */
  async flush(): Promise<void> {
    memoryStore.clear()
  },

  /**
   * Check if the cache backend is connected.
   * Always returns true for the in-memory store.
   */
  isRedisConnected(): boolean {
    return true
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
