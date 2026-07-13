import type { NextRequest } from 'next/server'
import { jsonResponse, requireAdmin, errorResponse } from '@/lib/auth'
import { ipRules } from '@/lib/security-store'

/**
 * DELETE /api/admin/security/ip-rules/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const idx = ipRules.findIndex((r) => r.id === id)
  if (idx === -1) {return errorResponse('Rule not found', 404)}

  ipRules.splice(idx, 1)
  return jsonResponse({ message: 'Rule removed' })
}
