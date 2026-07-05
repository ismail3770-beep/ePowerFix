import { jsonResponse, errorResponse } from '@/lib/auth'
import { ipRules } from '@/lib/security-store'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createIpRuleSchema = z.object({
  type: z.string().optional(),
  ip: z.string().min(1),
  reason: z.string().optional(),
}).passthrough()

// ─── GET /api/admin/security/ip-rules ─────────────────────────────────────────

export const GET = adminGetRoute(async (_request) => {
  return jsonResponse({ data: ipRules })
})

// ─── POST /api/admin/security/ip-rules ────────────────────────────────────────

export const POST = adminRoute(createIpRuleSchema, async (request, body, user) => {
  if (!body.ip) return errorResponse('ip is required', 400)

  const rule = {
    id: `rule-${Date.now()}`,
    type: body.type || 'manual_block',
    ip: body.ip,
    reason: body.reason || 'Manual block by admin',
    createdAt: new Date().toISOString(),
  }
  ipRules.push(rule)

  return jsonResponse({ data: rule, message: 'IP rule added' }, 201)
})
