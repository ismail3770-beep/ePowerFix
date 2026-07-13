// Notification routes: list, mark read, mark all read
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError } from '../lib/api-handler.js'
import { requireAuth, getAuthUser } from '../lib/auth.js'

const router = Router()

// ─── GET /api/notifications ───────────────────────────────────────────────────
// List the current user's notifications + unread count. Query: limit=N

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const rawLimit = parseInt((req.query.limit as string) || '10', 10)
    const limit = Math.min(50, Math.max(1, isNaN(rawLimit) ? 10 : rawLimit))

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id },
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ])

    res.json({
      success: true,
      data: { data: notifications, unreadCount },
    })
  })
)

// ─── PUT /api/notifications/read-all ──────────────────────────────────────────
// Mark all of the current user's notifications as read.
// NOTE: registered before /:id so the literal path wins over the param route.

router.put(
  '/read-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)

    await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    })

    res.json({ success: true, message: 'All notifications marked as read' })
  })
)

// ─── PUT /api/notifications/:id/read ──────────────────────────────────────────
// Mark a single notification as read.
// NOTE: The Next.js route used PUT; we accept both PUT and POST for client
// resilience (some callers may POST).

const markReadHandler = asyncHandler(async (req, res) => {
  const user = getAuthUser(req)
  const { id } = req.params

  const notif = await db.notification.findUnique({ where: { id } })
  if (!notif) {
    throw new ApiError('Notification not found', 404)
  }
  if (notif.userId !== user.id) {
    throw new ApiError('Forbidden', 403)
  }

  await db.notification.update({
    where: { id },
    data: { isRead: true },
  })

  res.json({ success: true, message: 'Marked as read' })
})

router.put('/:id/read', markReadHandler)
router.post('/:id/read', markReadHandler)

export default router
