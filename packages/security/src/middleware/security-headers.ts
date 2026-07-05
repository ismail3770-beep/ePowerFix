// ─── Security Headers Middleware ────────────────────
// 14+ headers from Really Simple SSL Pro + WP Defender

import type { Request, Response, NextFunction } from 'express'
import type { SecurityHeadersConfig } from '../types'

export function securityHeadersMiddleware(config: SecurityHeadersConfig) {
  if (!config.enabled) return (_req: Request, _res: Response, next: NextFunction) => next()

  return (req: Request, res: Response, next: NextFunction) => {
    // HSTS
    if (config.hsts) {
      let hsts = `max-age=${config.hstsMaxAge}`
      if (config.hstsIncludeSubDomains) hsts += '; includeSubDomains'
      if (config.hstsPreload) hsts += '; preload'
      res.setHeader('Strict-Transport-Security', hsts)
    }

    // X-Frame-Options
    if (config.xFrameOptions === 'DENY') {
      res.setHeader('X-Frame-Options', 'DENY')
    } else if (config.xFrameOptions === 'SAMEORIGIN') {
      res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    }

    // X-Content-Type-Options
    if (config.xContentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff')
    }

    // Referrer-Policy
    if (config.referrerPolicy) {
      res.setHeader('Referrer-Policy', config.referrerPolicy)
    }

    // Permissions-Policy
    if (Object.keys(config.permissionsPolicy).length > 0) {
      const policies = Object.entries(config.permissionsPolicy)
        .map(([directive, values]) => {
          const val = values.length > 0 ? `(${values.join(' ')})` : '()'
          return `${directive}=${val}`
        })
        .join(', ')
      res.setHeader('Permissions-Policy', policies)
    }

    // Cross-Origin Policies
    if (config.crossOriginOpenerPolicy) {
      res.setHeader('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy)
    }
    if (config.crossOriginResourcePolicy) {
      res.setHeader('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy)
    }
    // Skip COEP — it breaks many CDN resources
    // if (config.crossOriginEmbedderPolicy) {
    //   res.setHeader('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy)
    // }

    // X-XSS-Protection (legacy)
    if (config.xXSSProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block')
    }

    // Content-Security-Policy
    if (config.contentSecurityPolicy) {
      res.setHeader(
        'Content-Security-Policy' + (config.contentSecurityPolicyReportOnly ? '-Report-Only' : ''),
        config.contentSecurityPolicy
      )
    }

    // Upgrade Insecure Requests
    if (config.upgradeInsecureRequests) {
      res.setHeader('Upgrade-Insecure-Requests', '1')
    }

    // Remove server info
    res.removeHeader('X-Powered-By')
    res.removeHeader('Server')

    // No-Cache for auth pages
    if (req.path.includes('/login') || req.path.includes('/register') || req.path.includes('/admin')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')
    }

    next()
  }
}