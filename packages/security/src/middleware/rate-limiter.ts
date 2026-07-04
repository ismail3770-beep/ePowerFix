// ─── Rate Limiter Middleware ───────────────────────────
// Time-bucket sliding window with in-memory Map

import type { Request, Response, NextFunction } from 'express'
import type { RateLimitConfig, SecurityEvent } from '../types'
import { getClientIP } from '../utils/ip-utils'

const store = new Map<string, { count: number; windowStart: number; blockedUntil?: number }>()
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function startCleanup() {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now - entry.windowStart > 120000 && (!entry.blockedUntil || now > entry.blockedUntil)) {
        store.delete(key)
      }
    }
  }, 300000)
}

export function rateLimiterMiddleware(configs: RateLimitConfig[]) {
  if (!configs.some(c => c.enabled)) {
    return (_req: Request, _res: Response, next: NextFunction) => next()
  }
  startCleanup()

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIP(req)
    const now = Date.now()

    for (const config of configs) {
      if (!config.enabled) continue

      // Determine scope
      let scope = config.scope
      if (scope === 'login' && !req.path.includes('/login') && !req.path.includes('/auth/login')) continue
      if (scope === 'register' && !req.path.includes('/register') && !req.path.includes('/auth/register')) continue

      const key = `${ip}:${scope}`
      const entry = store.get(key)

      if (entry?.blockedUntil && now < entry.blockedUntil) {
        const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000)
        res.set('Retry-After', String(retryAfter))
        return res.status(config.throttleEnabled ? 429 : 403).json({
          error: config.throttleEnabled ? 'Too many requests' : 'Access Denied',
          retryAfter,
          scope: config.scope,
        })
      }

      if (!entry || now - entry.windowStart > config.windowMs) {
        store.set(key, { count: 1, windowStart: now })
        continue
      }

      entry.count++

      if (entry.count > config.maxRequests) {
        entry.blockedUntil = now + config.blockDurationMs

        const event: SecurityEvent = {
          id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
          type: 'RATE_LIMIT',
          ip,
          userAgent: req.headers['user-agent'] as string,
          path: req.path,
          method: req.method,
          details: { scope: config.scope, count: entry.count, maxRequests: config.maxRequests },
          timestamp: new Date(),
        }
        if (process.env.NODE_ENV !== 'test') {
          console.warn('[RATE_LIMIT]', JSON.stringify(event.details))
        }

        if (config.throttleEnabled) {
          const retryAfter = Math.ceil(config.blockDurationMs / 1000)
          res.set('Retry-After', String(retryAfter))
          return res.status(429).json({
            error: 'Too many requests',
            retryAfter,
            scope: config.scope,
          })
        }
        return res.status(403).json({ error: 'Access Denied', reason: 'rate_limit' })
      }
    }

    next()
  }
}

export function getRateLimitStatus(ip: string, scope: string) {
  const key = `${ip}:${scope}`
  return store.get(key) || null
}

export function resetRateLimit(ip: string, scope: string) {
  store.delete(`${ip}:${scope}`)
}