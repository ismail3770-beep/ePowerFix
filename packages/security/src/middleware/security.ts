// ─── Main Security Middleware ─────────────────────
// Chain: IP Guard → WAF → Bot Detector → Rate Limiter → Security Headers

import type { Request, Response, NextFunction } from 'express'
import type { SecurityEvent } from '../types'
import type { SecurityConfig } from '../config'
import { DefaultSecurityConfig } from '../config'
import { ipGuardMiddleware } from './ip-guard'
import { wafMiddleware } from './waf'
import { botDetectorMiddleware } from './bot-detector'
import { rateLimiterMiddleware } from './rate-limiter'
import { securityHeadersMiddleware } from './security-headers'

type EventListener = (event: SecurityEvent) => void
const listeners: EventListener[] = []

export function onSecurityEvent(listener: EventListener) {
  listeners.push(listener)
}

export function securityMiddleware(userConfig?: Partial<SecurityConfig>) {
  const config: SecurityConfig = {
    ...DefaultSecurityConfig,
    ...userConfig,
    headers: { ...DefaultSecurityConfig.headers, ...userConfig?.headers },
    rateLimiter: userConfig?.rateLimiter || DefaultSecurityConfig.rateLimiter,
  }

  const ipGuard = ipGuardMiddleware(config.ipGuard)
  const waf = wafMiddleware(config.waf)
  const botDetector = botDetectorMiddleware(config.botDetector)
  const rateLimiter = rateLimiterMiddleware(config.rateLimiter)
  const headers = securityHeadersMiddleware(config.headers)

  return (req: Request, res: Response, next: NextFunction) => {
    // Skip excluded paths
    if (config.excludedPaths.some(p => req.path.startsWith(p))) {
      return next()
    }

    // Chain: IP → WAF → Bot → Rate → Headers → next
    ipGuard(req, res, (err?: any) => {
      if (err || res.headersSent) return
      waf(req, res, (err?: any) => {
        if (err || res.headersSent) return
        botDetector(req, res, (err?: any) => {
          if (err || res.headersSent) return
          rateLimiter(req, res, (err?: any) => {
            if (err || res.headersSent) return
            headers(req, res, next)
          })
        })
      })
    })
  }
}