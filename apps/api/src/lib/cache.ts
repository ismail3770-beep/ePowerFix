// Simple in-memory cache with optional Redis support
// For production, set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

import { Redis } from '@upstash/redis'
import { env } from '../config/env.js'

interface CacheEntry {
  value: unknown
  expiresAt: number
}

let redis: Redis | null = null
const memoryCache = new Map<string, CacheEntry>()

function getRedis(): Redis | null {
  if (redis) return redis
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) return null
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  })
  return redis
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first (fast)
    const mem = memoryCache.get(key)
    if (mem && mem.expiresAt > Date.now()) {
      return mem.value as T
    }
    if (mem) {
      memoryCache.delete(key)
    }

    // Try Redis
    const r = getRedis()
    if (r) {
      try {
        const val = await r.get<T>(key)
        if (val !== null) {
          // Populate memory cache
          memoryCache.set(key, { value: val, expiresAt: Date.now() + 60000 })
          return val
        }
      } catch {
        // Fall through to return null
      }
    }
    return null
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
    const r = getRedis()
    if (r) {
      try {
        await r.set(key, value, { ex: ttlSeconds })
      } catch {
        // Ignore Redis errors
      }
    }
  },

  async getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = await cache.get<T>(key)
    if (cached !== null) return cached
    const fresh = await fetcher()
    await cache.set(key, fresh, ttlSeconds)
    return fresh
  },

  async del(key: string): Promise<void> {
    memoryCache.delete(key)
    const r = getRedis()
    if (r) {
      try {
        await r.del(key)
      } catch {
        // Ignore
      }
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    // Clear matching memory cache keys
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key)
      }
    }
    // Clear Redis keys
    const r = getRedis()
    if (r) {
      try {
        const keys = await r.keys(pattern)
        if (keys.length > 0) {
          await r.del(...keys)
        }
      } catch {
        // Ignore
      }
    }
  },
}

export const cacheKeys = {
  products: (page: number, limit: number, search: string) =>
    `products:list:${page}:${limit}:${search || 'all'}`,
  product: (id: string) => `product:${id}`,
  categories: (withCounts: boolean) => `categories:${withCounts ? 'counts' : 'no-counts'}`,
  brands: () => 'brands:all',
  settings: () => 'settings:default',
  // Banner cache key includes the optional type filter (hero|services|promo|undefined).
  banners: (type?: string) => `banners:active:${type || 'all'}`,
  // Blog posts cache key keyed on the requested limit (page-1 / no-filter only).
  blogPosts: (limit: number) => `blog:list:${limit}`,
  services: () => 'services:active',
  projectKits: () => 'project-kits:active',
}
