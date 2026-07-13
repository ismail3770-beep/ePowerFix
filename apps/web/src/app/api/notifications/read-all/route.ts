import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/auth'

/**
 * PUT /api/notifications/read-all
 * Mark all of the current user's notifications as read.
 */
export async function PUT(_request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) {return auth.response!}

    await db.notification.updateMany({
      where: { userId: auth.user!.id, isRead: false },
      data: { isRead: true },
    })

    return jsonResponse({ success: true, message: 'All notifications marked as read' })
  } catch (err: any) {
    console.error('public/notifications/read-all PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
