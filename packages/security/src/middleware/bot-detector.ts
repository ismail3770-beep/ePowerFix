// ─── Bot Detector Middleware ──────────────────────────
// Signal-based scoring adapted from WP Simple Firewall (27 signals)

import type { Request, Response, NextFunction } from 'express'
import type { BotDetectorConfig, BotSignal, SecurityEvent } from '../types'
import { getClientIP } from '../utils/ip-utils'
import { KNOWN_BOT_UA_PATTERNS, KNOWN_CRAWLER_UA_PREFIXES } from '../utils/patterns'

const botSignals = new Map<string, BotSignal>()
let cleanupTimer: ReturnType<typeof setInterval> | null = null

const MINUTE = 60
const HOUR = 3600
const DAY = 86400
const WEEK = 604800

interface ScoreBoundary {
  seconds: number
  score: number
}

const NEGATIVE_SIGNALS: Record<string, ScoreBoundary[]> = {
  btloginfail: [{ seconds: MINUTE, score: -75 }, { seconds: -1, score: -45 }],
  ratelimit: [{ seconds: MINUTE, score: -55 }, { seconds: -1, score: -25 }],
  firewall: [{ seconds: DAY, score: -35 }, { seconds: -1, score: -15 }],
  blocked: [{ seconds: DAY, score: -55 }, { seconds: -1, score: -45 }],
  bt404: [{ seconds: HOUR, score: -15 }, { seconds: -1, score: -5 }],
  honeypot: [{ seconds: DAY, score: -80 }, { seconds: -1, score: -40 }],
  fakecrawler: [{ seconds: DAY, score: -70 }, { seconds: -1, score: -35 }],
  suspiciouspath: [{ seconds: HOUR, score: -20 }, { seconds: -1, score: -10 }],
}

const POSITIVE_SIGNALS: Record<string, ScoreBoundary[]> = {
  auth: [{ seconds: DAY, score: 175 }, { seconds: -1, score: 150 }],
  frontpage: [{ seconds: HOUR, score: 25 }, { seconds: -1, score: 15 }],
  notbot: [{ seconds: 0, score: -10 }, { seconds: HOUR, score: 100 }, { seconds: -1, score: 75 }],
  knownservice: [{ seconds: 0, score: 100 }],
}

function calculateBotScore(signals: BotSignal): number {
  let total = 0
  const sigs = signals.signals as any

  for (const [field, boundaries] of Object.entries(NEGATIVE_SIGNALS)) {
    const lastAt = sigs[`${field}_at`] || 0
    const diff = lastAt === 0 ? Infinity : Math.floor(Date.now() / 1000) - lastAt
    for (const b of boundaries.sort((a, c) => a.seconds - c.seconds)) {
      if (b.seconds === -1) { total += b.score; break }
      if (diff < b.seconds) { total += b.score; break }
    }
  }

  for (const [field, boundaries] of Object.entries(POSITIVE_SIGNALS)) {
    const lastAt = sigs[`${field}_at`] || 0
    const diff = lastAt === 0 ? Infinity : Math.floor(Date.now() / 1000) - lastAt
    for (const b of boundaries.sort((a, c) => a.seconds - c.seconds)) {
      if (b.seconds === -1) { total += b.score; break }
      if (diff < b.seconds) { total += b.score; break }
    }
  }

  return Math.max(0, Math.min(100, 50 + total))
}

function isFakeCrawler(ua: string): boolean {
  for (const prefix of KNOWN_CRAWLER_UA_PREFIXES) {
    if (ua.toLowerCase().includes(prefix.toLowerCase())) {
      const isLowerCase = ua === ua.toLowerCase()
      const hasVersion = /\d+\.\d+/.test(ua)
      if (!isLowerCase || !hasVersion) return true
      const parts = ua.split(/\s+/)
      if (parts.length < 3) return true
    }
  }
  return false
}

function detectAIBot(ua: string): boolean {
  const aiPatterns = KNOWN_BOT_UA_PATTERNS.filter(p => p.type === 'ai')
  return aiPatterns.some(p => p.pattern.test(ua))
}

function getBotIdentity(ua: string): string | undefined {
  const good = KNOWN_BOT_UA_PATTERNS.filter(p => p.type === 'good')
  for (const p of good) {
    if (p.pattern.test(ua)) {
      return p.pattern.source.replace(/\/i?$/, '').split('\\')[0]
    }
  }
  return undefined
}

export function botDetectorMiddleware(config: BotDetectorConfig) {
  if (!config.enabled) return (_req: Request, _res: Response, next: NextFunction) => next()

  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      const cutoff = Date.now() / 1000 - WEEK
      for (const [ip, signal] of botSignals) {
        if (signal.lastSeenAt < cutoff) botSignals.delete(ip)
      }
    }, 3600000)
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIP(req)
    const ua = req.headers['user-agent'] || ''

    let signal = botSignals.get(ip)
    if (!signal) {
      signal = { ip, signals: {}, lastSeenAt: Math.floor(Date.now() / 1000), isBot: false, score: 50 }
      botSignals.set(ip, signal)
    }
    signal.lastSeenAt = Math.floor(Date.now() / 1000)

    const now = Math.floor(Date.now() / 1000)

    if (req.path === '/') (signal.signals as any)['frontpage_at'] = now
    if (res.statusCode === 404 && config.track404s) (signal.signals as any)['bt404_at'] = now
    if (config.fakeCrawlerDetection && isFakeCrawler(ua)) (signal.signals as any)['fakecrawler_at'] = now

    const identity = getBotIdentity(ua)
    if (identity) {
      signal.identity = identity
      ;(signal.signals as any)['knownservice_at'] = now
    }
    if (detectAIBot(ua)) (signal.signals as any)['aibot_at'] = now

    signal.score = calculateBotScore(signal)

    // High reputation override
    if (config.highReputationMinimum > 0 && signal.score >= config.highReputationMinimum) {
      signal.isBot = false
      return next()
    }

    if (config.minimumBotScore > 0 && signal.score < config.minimumBotScore) {
      signal.isBot = true

      const event: SecurityEvent = {
        id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
        type: 'BOT_DETECTED',
        ip,
        userAgent: ua,
        path: req.path,
        method: req.method,
        details: { score: signal.score, identity, isFakeCrawler: isFakeCrawler(ua) },
        timestamp: new Date(),
        score: signal.score,
      }
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[BOT_DETECTED]', JSON.stringify(event.details))
      }

      if (identity) return next()

      return res.status(403).json({
        error: 'Access Denied',
        reason: 'bot_detected',
        botScore: signal.score,
      })
    }

    next()
  }
}

export function recordBotSignal(ip: string, signalName: string) {
  let signal = botSignals.get(ip)
  if (!signal) {
    signal = { ip, signals: {}, lastSeenAt: 0, isBot: false, score: 50 }
    botSignals.set(ip, signal)
  }
  ;(signal.signals as any)[`${signalName}_at`] = Math.floor(Date.now() / 1000)
}

export function getBotScore(ip: string): number | null {
  return botSignals.get(ip)?.score ?? null
}

export function getBotSignals(): BotSignal[] {
  return Array.from(botSignals.values())
}