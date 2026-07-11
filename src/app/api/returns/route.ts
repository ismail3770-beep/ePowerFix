import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/auth'

/**
 * GET /api/returns?limit=N
 * List the current user's return requests.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) {return auth.response!}

    const url = new URL(request.url)
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))

    const returns = await db.returnRequest.findMany({
      where: { userId: auth.user!.id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { order: { include: { items: true } } },
    })

    return jsonResponse({ data: returns })
  } catch (err: any) {
    console.error('public/returns GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
