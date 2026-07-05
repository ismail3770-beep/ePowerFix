import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/auth'

/**
 * GET /api/notifications?limit=N
 * List the current user's notifications + unread count.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response!

    const url = new URL(request.url)
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10', 10)))

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: auth.user!.id },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.notification.count({
        where: { userId: auth.user!.id, isRead: false },
      }),
    ])

    return jsonResponse({
      success: true,
      data: { data: notifications, unreadCount },
    })
  } catch (err: any) {
    console.error('public/notifications GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
