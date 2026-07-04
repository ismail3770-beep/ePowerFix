// ─── IP Guard Middleware ─────────────────────────────────
// Multi-type IP blocking with CIDR support

import type { Request, Response, NextFunction } from 'express'
import type { IPGuardConfig, IPRule, SecurityEvent } from '../types'
import { getClientIP, isIPInRange } from '../utils/ip-utils'

let rules: IPRule[] = []
let autoBlockCounters = new Map<string, number>()
let cleanupTimer: ReturnType<typeof setInterval> | null = null

export function ipGuardMiddleware(config: IPGuardConfig) {
  if (!config.enabled) return (_req: Request, _res: Response, next: NextFunction) => next()

  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      const now = Date.now()
      rules = rules.filter(r => !r.expiresAt || r.expiresAt.getTime() > now)
      autoBlockCounters = new Map()
    }, 60000)
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIP(req, config.trustedProxies)

    // 1. Whitelist always wins
    const whitelist = rules.find(r => r.type === 'manual_bypass' && matchIP(ip, r))
    if (whitelist) {
      req.headers['x-security-whitelisted'] = 'true'
      return next()
    }

    // 2. Manual block
    const manualBlock = rules.find(r => r.type === 'manual_block' && matchIP(ip, r) && !isExpired(r))
    if (manualBlock) {
      return blockResponse(res, ip, 'manual_block', manualBlock.reason)
    }

    // 3. Auto block
    const autoBlock = rules.find(r => r.type === 'auto_block' && matchIP(ip, r) && !isExpired(r))
    if (autoBlock) {
      return blockResponse(res, ip, 'auto_block', autoBlock.reason)
    }

    // 4. Pattern blocks (bitmask AND logic)
    for (const rule of rules) {
      if (rule.type !== 'pattern_block' || isExpired(rule)) continue

      let expectedBits = 0
      let foundBits = 0

      if (rule.ip || rule.cidr) {
        expectedBits |= 1
        if (rule.cidr ? isIPInRange(ip, rule.cidr) : matchIP(ip, rule)) foundBits |= 1
      }
      if (rule.userAgent) {
        expectedBits |= 2
        if (new RegExp(rule.userAgent, 'i').test(req.headers['user-agent'] || '')) foundBits |= 2
      }
      if (rule.referrer) {
        expectedBits |= 4
        if (new RegExp(rule.referrer, 'i').test(req.headers['referer'] || '')) foundBits |= 4
      }

      if (expectedBits > 0 && foundBits === expectedBits) {
        return blockResponse(res, ip, 'pattern_block', rule.reason)
      }
    }

    next()
  }
}

function matchIP(ip: string, rule: IPRule): boolean {
  if (rule.ip && ip === rule.ip) return true
  if (rule.cidr && isIPInRange(ip, rule.cidr)) return true
  return false
}

function isExpired(rule: IPRule): boolean {
  return rule.expiresAt !== undefined && new Date(rule.expiresAt).getTime() < Date.now()
}

function blockResponse(res: Response, ip: string, type: string, reason: string) {
  const event: SecurityEvent = {
    id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    type: 'IP_BLOCKED',
    ip,
    path: '',
    method: '',
    details: { blockType: type, reason },
    timestamp: new Date(),
  }
  if (process.env.NODE_ENV !== 'test') {
    console.warn('[IP_BLOCKED]', JSON.stringify(event.details))
  }
  return res.status(403).json({ error: 'Access Denied', reason, blockType: type })
}

// ── Rule Management API ──
export function addRule(rule: Omit<IPRule, 'id' | 'createdAt'>): IPRule {
  if (rule.type === 'manual_bypass') {
    rules = rules.filter(r => r.ip !== rule.ip)
  } else if (rule.type === 'manual_block') {
    rules = rules.filter(r => r.ip === rule.ip && r.type === 'auto_block')
  }
  const newRule: IPRule = {
    ...rule,
    id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
    createdAt: new Date(),
  }
  rules.push(newRule)
  return newRule
}

export function removeRule(id: string): boolean {
  const len = rules.length
  rules = rules.filter(r => r.id !== id)
  return rules.length < len
}

export function getRules(type?: string): IPRule[] {
  if (type) return rules.filter(r => r.type === type)
  return [...rules]
}

export function recordOffense(ip: string, config: IPGuardConfig): boolean {
  if (config.autoBlockThreshold === 0) return false
  const count = (autoBlockCounters.get(ip) || 0) + 1
  autoBlockCounters.set(ip, count)
  if (count >= config.autoBlockThreshold) {
    const existing = rules.find(r => r.type === 'auto_block' && r.ip === ip && !isExpired(r))
    if (!existing) {
      addRule({
        type: 'auto_block',
        ip,
        reason: `Auto-blocked: ${count} security offenses`,
        expiresAt: new Date(Date.now() + config.autoBlockDurationMs),
        offenses: count,
        createdBy: 'system',
      })
      autoBlockCounters.delete(ip)
      return true
    }
  }
  return false
}

export function clearOffenses(ip: string) {
  autoBlockCounters.delete(ip)
}