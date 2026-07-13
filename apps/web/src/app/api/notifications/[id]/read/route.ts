import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/auth'

/**
 * PUT /api/notifications/[id]/read
 * Mark a single notification as read.
 */
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) {return auth.response!}

    const { id } = await params
    const notif = await db.notification.findUnique({ where: { id } })
    if (!notif) {return errorResponse('Notification not found', 404)}
    if (notif.userId !== auth.user!.id) {return errorResponse('Forbidden', 403)}

    await db.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return jsonResponse({ success: true, message: 'Marked as read' })
  } catch (err: any) {
    console.error('public/notifications/[id]/read PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
