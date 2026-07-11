import { jsonResponse, errorResponse } from '@/lib/auth'
import { adminRoute, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const unlockIpSchema = z.object({
  ip: z.string().min(1),
}).passthrough()

// ─── POST /api/admin/security/unlock-ip ───────────────────────────────────────
// Stub — always reports success since we don't persist locked IPs.

export const POST = adminRoute(unlockIpSchema, async (request, body, user) => {
  if (!body.ip) {return errorResponse('ip is required', 400)}

  return jsonResponse({ data: { ip: body.ip, unlocked: true }, message: 'IP unlocked' })
})
