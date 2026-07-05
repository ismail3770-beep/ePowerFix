import { NextRequest } from 'next/server'
import { jsonResponse, requireAdmin } from '@/lib/auth'

/**
 * GET /api/admin/security/audit-logs?limit=N
 * Returns recent audit log entries (stub — empty by default).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const url = new URL(request.url)
  const limit = Math.min(500, parseInt(url.searchParams.get('limit') || '100', 10))

  return jsonResponse({
    entries: [],
    total: 0,
    limit,
  })
}
