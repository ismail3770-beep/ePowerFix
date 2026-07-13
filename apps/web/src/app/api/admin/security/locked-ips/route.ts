import type { NextRequest } from 'next/server'
import { jsonResponse, requireAdmin } from '@/lib/auth'

/**
 * GET /api/admin/security/locked-ips
 * Returns currently locked IPs (stub — empty by default).
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  return jsonResponse({ data: [] })
}
