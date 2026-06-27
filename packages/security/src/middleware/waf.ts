// ─── WAF Middleware ───────────────────────────────────────
// Cumulative scoring WAF adapted from Wordfence + WP Simple Firewall

import type { Request, Response, NextFunction } from 'express'
import type { WAFConfig, SecurityEvent } from '../types'
import { WAF_PATTERNS } from '../utils/patterns'

interface WAFResult {
  blocked: boolean
  scores: Record<string, Record<string, number>>
  matchedPatterns: { param: string; category: string; pattern: string; score: number; description: string }[]
}

export function wafMiddleware(config: WAFConfig) {
  if (!config.enabled || config.mode === 'disabled') {
    return (_req: Request, _res: Response, next: NextFunction) => next()
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const result = evaluateRequest(req, config)

    if (result.matchedPatterns.length > 0) {
      const event: SecurityEvent = {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        type: 'WAF_BLOCK',
        ip: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] as string,
        path: req.path,
        method: req.method,
        details: {
          matchedPatterns: result.matchedPatterns,
          scores: result.scores,
          mode: config.mode,
        },
        timestamp: new Date(),
        score: Math.max(...result.matchedPatterns.map(p => p.score)),
      }
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[WAF]', JSON.stringify(event.details))
      }
    }

    if (result.blocked && config.mode === 'enabled' && !config.logOnly) {
      return res.status(403).json({
        error: 'Security Policy Violation',
        blocked: true,
        waf: {
          matchedPatterns: result.matchedPatterns.map(p => ({
            param: p.param,
            category: p.category,
            description: p.description,
            score: p.score,
          })),
        },
      })
    }

    next()
  }
}

function evaluateRequest(req: Request, config: WAFConfig): WAFResult {
  const result: WAFResult = {
    blocked: false,
    scores: {},
    matchedPatterns: [],
  }

  // Collect all request parameters
  const params: Record<string, string> = {}
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query as Record<string, unknown>)) {
      params[key] = String(value)
    }
  }
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body as Record<string, unknown>)) {
      if (typeof value === 'string') {
        params[key] = value
      } else if (value && typeof value === 'object') {
        params[`${key}_nested`] = JSON.stringify(value)
      }
    }
  }

  // Evaluate each parameter against enabled pattern categories
  for (const [paramKey, paramValue] of Object.entries(params)) {
    for (const category of config.patterns) {
      const patterns = WAF_PATTERNS[category]
      if (!patterns) continue

      for (const rule of patterns) {
        try {
          if (rule.pattern.test(paramValue)) {
            if (!result.scores[paramKey]) result.scores[paramKey] = {}
            result.scores[paramKey][category] = (result.scores[paramKey][category] || 0) + rule.score

            result.matchedPatterns.push({
              param: paramKey,
              category,
              pattern: rule.pattern.source,
              score: rule.score,
              description: rule.description,
            })

            if (result.scores[paramKey][category] >= config.failThreshold) {
              result.blocked = true
            }
          }
        } catch {
          // Invalid regex — skip
        }
      }
    }
  }

  return result
}