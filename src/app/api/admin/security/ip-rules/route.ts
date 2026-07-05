import { NextRequest } from 'next/server'
import { jsonResponse, requireAdmin, parseBody, errorResponse } from '@/lib/auth'
import { ipRules } from '@/lib/security-store'

/**
 * GET /api/admin/security/ip-rules
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  return jsonResponse({ data: ipRules })
}

/**
 * POST /api/admin/security/ip-rules
 * Body: { type, ip, reason }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const body = await parseBody<any>(request)
  if (!body) return errorResponse('Invalid request body', 400)
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
}
