// Rate limiting: Redis-backed (Upstash) with in-memory fallback for dev.
// Ported from apps/web/src/lib/rate-limit.ts — adapted to read env from config/env.js.

import { Redis } from '@upstash/redis'
import { env } from '../config/env.js'

// --- Redis Client ------------------------------------------------------------

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    if (env.NODE_ENV === 'production') {
      console.warn(
        '[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set - rate limiting disabled in production!'
      )
    }
    return null
  }

  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  })
  return redis
}

// --- In-Memory Fallback (dev only) -------------------------------------------

type RateLimitEntry = { count: number; resetTime: number }

const memoryStore = new Map<string, RateLimitEntry>()

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore) {
      if (now > entry.resetTime) memoryStore.delete(key)
    }
  }, 5 * 60 * 1000)
}

async function memoryCheckRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetTime - now }
  }

  memoryStore.set(key, { count: entry.count + 1, resetTime: entry.resetTime })
  return { allowed: true, retryAfterMs: 0 }
}

// --- Rate Limit API ----------------------------------------------------------

/**
 * Check if a request is within rate limits.
 * @param key Unique identifier for the rate limit bucket (e.g., "login:192.168.1.1")
 * @param maxRequests Maximum requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns { allowed: boolean, retryAfterMs: number }
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const client = getRedis()

  if (client) {
    // Use Redis INCR with TTL for atomic rate limiting
    const redisKey = `ratelimit:${key}`
    const windowSeconds = Math.ceil(windowMs / 1000)

    const count = await client.incr(redisKey)

    if (count === 1) {
      // First request in window - set expiry
      await client.expire(redisKey, windowSeconds)
    }

    if (count > maxRequests) {
      const ttl = await client.ttl(redisKey)
      return { allowed: false, retryAfterMs: ttl * 1000 }
    }

    return { allowed: true, retryAfterMs: 0 }
  }

  // Fallback to in-memory (dev only)
  return memoryCheckRateLimit(key, maxRequests, windowMs)
}

/**
 * Reset a rate limit key (useful for testing or manual unlock).
 */
export async function resetRateLimit(key: string): Promise<void> {
  const client = getRedis()
  if (client) {
    await client.del(`ratelimit:${key}`)
    return
  }
  memoryStore.delete(key)
}
