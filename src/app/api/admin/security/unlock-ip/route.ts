import { NextRequest } from 'next/server'
import { jsonResponse, requireAdmin, parseBody, errorResponse } from '@/lib/auth'

/**
 * POST /api/admin/security/unlock-ip
 * Body: { ip }
 * Stub — always reports success since we don't persist locked IPs.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const body = await parseBody<any>(request)
  if (!body?.ip) return errorResponse('ip is required', 400)

  return jsonResponse({ data: { ip: body.ip, unlocked: true }, message: 'IP unlocked' })
}
