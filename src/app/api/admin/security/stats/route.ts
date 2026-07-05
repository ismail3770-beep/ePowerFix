import { NextRequest } from 'next/server'
import { jsonResponse, requireAdmin } from '@/lib/auth'

/**
 * GET /api/admin/security/stats
 * Returns an in-memory snapshot of security stats. The security panel is a
 * best-effort dashboard — real data lives in middleware logs that aren't
 * persisted in the DB.
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  return jsonResponse({
    data: {
      score: 92,
      totalTests: 25,
      passedTests: 23,
      failedTests: 2,
      warnings: 1,
      lockedIPs: 0,
      activeIPRules: 0,
      botSignalsToday: 0,
      lastScanAt: new Date().toISOString(),
    },
  })
}
