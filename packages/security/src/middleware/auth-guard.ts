// ─── Auth Guard Middleware ────────────────────────────
// Brute force protection + login failure tracking

import type { Request, Response, NextFunction } from 'express'
import type { AuthGuardConfig, SecurityEvent } from '../types'
import { getClientIP } from '../utils/ip-utils'

interface LoginAttempt {
  ip: string
  count: number
  windowStart: number
  lockedUntil?: number
  lastAttemptAt: number
}

const loginAttempts = new Map<string, LoginAttempt>()
let cleanupTimer: ReturnType<typeof setInterval> | null = null

interface AuthGuardMiddleware extends Function {
  (req: Request, res: Response, next: NextFunction): void
  recordFailure: (req: Request) => number
  recordSuccess: (req: Request) => void
  getLockoutStatus: (ip: string) => { locked: boolean; remaining: number; attempts: number } | null
}

export function authGuardMiddleware(config: AuthGuardConfig): AuthGuardMiddleware {
  if (!config.enabled) {
    const pass = (_req: Request, _res: Response, next: NextFunction) => next()
    pass.recordFailure = () => 0
    pass.recordSuccess = () => {}
    pass.getLockoutStatus = () => null
    return pass
  }

  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [key, attempt] of loginAttempts) {
        if (now - attempt.windowStart > config.failedAttemptWindowMs * 2) {
          loginAttempts.delete(key)
        }
      }
    }, 60000)
  }

  const authCheck = (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIP(req)
    const now = Date.now()
    const entry = loginAttempts.get(ip)

    if (entry?.lockedUntil && now < entry.lockedUntil) {
      const remaining = Math.ceil((entry.lockedUntil - now) / 1000)
      const event: SecurityEvent = {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        type: 'BRUTE_FORCE',
        ip,
        path: req.path,
        method: req.method,
        details: { remaining, attempts: entry.count, max: config.maxLoginAttempts },
        timestamp: new Date(),
      }
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[BRUTE_FORCE]', JSON.stringify(event.details))
      }

      return res.status(429).json({
        error: config.maskLoginErrors
          ? 'Invalid credentials'
          : `Account temporarily locked. Try again in ${remaining}s.`,
        locked: true,
        remaining,
      })
    }

    next()
  }

  authCheck.recordFailure = (req: Request) => {
    const ip = getClientIP(req)
    const now = Date.now()
    let entry = loginAttempts.get(ip)

    if (!entry || now - entry.windowStart > config.failedAttemptWindowMs) {
      entry = { ip, count: 0, windowStart: now, lastAttemptAt: now }
      loginAttempts.set(ip, entry)
    }

    entry.count++
    entry.lastAttemptAt = now

    if (entry.count >= config.maxLoginAttempts) {
      entry.lockedUntil = now + config.lockoutDurationMs
      const event: SecurityEvent = {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        type: 'BRUTE_FORCE',
        ip,
        path: req.path,
        method: req.method,
        details: { attempts: entry.count, lockedUntil: new Date(entry.lockedUntil).toISOString() },
        timestamp: new Date(),
      }
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[BRUTE_FORCE_LOCKOUT]', JSON.stringify(event.details))
      }
    }

    return entry.count
  }

  authCheck.recordSuccess = (req: Request) => {
    const ip = getClientIP(req)
    loginAttempts.delete(ip)
  }

  authCheck.getLockoutStatus = (ip: string) => {
    const entry = loginAttempts.get(ip)
    if (!entry?.lockedUntil) return null
    const now = Date.now()
    if (now >= entry.lockedUntil) {
      loginAttempts.delete(ip)
      return null
    }
    return { locked: true, remaining: Math.ceil((entry.lockedUntil - now) / 1000), attempts: entry.count }
  }

  return authCheck as AuthGuardMiddleware
}

export function getLoginAttemptStatus(ip: string) {
  return loginAttempts.get(ip) || null
}

export function getAllLockedIPs(): { ip: string; lockedUntil: number; attempts: number }[] {
  const now = Date.now()
  const results: { ip: string; lockedUntil: number; attempts: number }[] = []
  for (const [, entry] of loginAttempts) {
    if (entry.lockedUntil && now < entry.lockedUntil) {
      results.push({ ip: entry.ip, lockedUntil: entry.lockedUntil, attempts: entry.count })
    }
  }
  return results
}

export function unlockIP(ip: string) {
  loginAttempts.delete(ip)
}