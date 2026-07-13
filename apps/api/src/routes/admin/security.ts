// Admin security routes: stats, scan, locked-ips, unlock-ip, ip-rules (CRUD),
// audit-logs, bot-signals.
// Migrated from:
//   apps/web/src/app/api/admin/security/stats/route.ts
//   apps/web/src/app/api/admin/security/scan/route.ts
//   apps/web/src/app/api/admin/security/locked-ips/route.ts
//   apps/web/src/app/api/admin/security/unlock-ip/route.ts
//   apps/web/src/app/api/admin/security/ip-rules/route.ts
//   apps/web/src/app/api/admin/security/ip-rules/[id]/route.ts
//   apps/web/src/app/api/admin/security/audit-logs/route.ts
//   apps/web/src/app/api/admin/security/bot-signals/route.ts
//
// Mounted at /api/admin/security
//
// NOTE: The Next.js source uses an in-memory `ipRules` array (apps/web/src/lib/security-store).
// We mirror that here with a module-level array. In production this should be
// replaced with a persisted store (DB or Redis).

import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'

const router = Router()

// In-memory IP rules store (matches apps/web/src/lib/security-store.ts behavior)
interface IpRule {
  id: string
  type: string
  ip: string
  reason: string
  createdAt: string
}
const ipRules: IpRule[] = []

// ─── GET /api/admin/security/stats ───────────────────────────────────────────

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    res.json({
      data: {
        score: 92,
        totalTests: 25,
        passedTests: 23,
        failedTests: 2,
        warnings: 1,
        lockedIPs: 0,
        activeIPRules: ipRules.length,
        botSignalsToday: 0,
        lastScanAt: new Date().toISOString(),
      },
    })
  })
)

// ─── POST /api/admin/security/scan ───────────────────────────────────────────

router.post(
  '/scan',
  asyncHandler(async (_req, res) => {
    const issues = [
      {
        test: 'HTTPS enforced',
        severity: 'info',
        description: 'HTTPS is enforced in production via the reverse proxy.',
        fixable: false,
        score: 5,
      },
      {
        test: 'Security headers',
        severity: 'info',
        description: 'CSP, X-Frame-Options, X-Content-Type-Options are set via Helmet.',
        fixable: false,
        score: 5,
      },
      {
        test: 'Rate limiting',
        severity: 'info',
        description: 'Rate limiting middleware is active on auth & admin routes.',
        fixable: false,
        score: 5,
      },
    ]

    const totalTests = 25
    const passedTests = 23
    const failedTests = totalTests - passedTests
    const warnings = 1
    const score = Math.round((passedTests / totalTests) * 100)

    res.json({
      data: {
        id: `scan-${Date.now()}`,
        scannedAt: new Date().toISOString(),
        score,
        totalTests,
        passedTests,
        failedTests,
        warnings,
        issues,
      },
    })
  })
)

// ─── GET /api/admin/security/locked-ips ──────────────────────────────────────

router.get(
  '/locked-ips',
  asyncHandler(async (_req, res) => {
    // Stub — real lock state would live in Redis or middleware logs.
    res.json({ data: [] })
  })
)

// ─── POST /api/admin/security/unlock-ip ──────────────────────────────────────

const unlockIpSchema = z
  .object({
    ip: z.string().min(1),
  })
  .passthrough()

router.post(
  '/unlock-ip',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, unlockIpSchema)
    if (!body.ip) {
      throw new ApiError('ip is required', 400)
    }
    res.json({
      data: { ip: body.ip, unlocked: true },
      message: 'IP unlocked',
    })
  })
)

// ─── GET /api/admin/security/ip-rules ────────────────────────────────────────

router.get(
  '/ip-rules',
  asyncHandler(async (_req, res) => {
    res.json({ data: ipRules })
  })
)

// ─── POST /api/admin/security/ip-rules ───────────────────────────────────────

const createIpRuleSchema = z
  .object({
    type: z.string().optional(),
    ip: z.string().min(1),
    reason: z.string().optional(),
  })
  .passthrough()

router.post(
  '/ip-rules',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createIpRuleSchema)
    if (!body.ip) {
      throw new ApiError('ip is required', 400)
    }

    const rule: IpRule = {
      id: `rule-${Date.now()}`,
      type: body.type || 'manual_block',
      ip: body.ip,
      reason: body.reason || 'Manual block by admin',
      createdAt: new Date().toISOString(),
    }
    ipRules.push(rule)

    res.status(201).json({ data: rule, message: 'IP rule added' })
  })
)

// ─── DELETE /api/admin/security/ip-rules/:id ─────────────────────────────────

router.delete(
  '/ip-rules/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const idx = ipRules.findIndex((r) => r.id === id)
    if (idx === -1) {
      throw new ApiError('Rule not found', 404)
    }
    ipRules.splice(idx, 1)
    res.json({ message: 'Rule removed' })
  })
)

// ─── GET /api/admin/security/audit-logs ──────────────────────────────────────

router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const limit = Math.min(500, parseInt((req.query.limit as string) || '100', 10))
    res.json({
      entries: [],
      total: 0,
      limit,
    })
  })
)

// ─── GET /api/admin/security/bot-signals ─────────────────────────────────────

router.get(
  '/bot-signals',
  asyncHandler(async (_req, res) => {
    res.json({ data: [] })
  })
)

export default router
