import { Router } from 'express'
import { db } from '@epowerfix/db'
import { requireAuth } from '../middleware/auth'
import { success, error } from '../utils/response'
import { getPagination } from '@epowerfix/utils'

export const notificationsRouter = Router()

// GET /api/notifications — the authenticated user's notifications (paginated)
notificationsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query as any
    const { skip, take } = getPagination({ page: Number(page), limit: Number(limit) })
    const where = { userId: req.user!.id }

    const [data, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId: req.user!.id, isRead: false } }),
    ])

    res.json(success({ data, unreadCount, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/notifications/unread-count — lightweight badge counter
notificationsRouter.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const unreadCount = await db.notification.count({
      where: { userId: req.user!.id, isRead: false },
    })
    res.json(success({ unreadCount }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/notifications/:id/read — mark a single notification as read
notificationsRouter.put('/:id/read', requireAuth, async (req, res) => {
  try {
    // Ensure the notification belongs to the user
    const existing = await db.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    })
    if (!existing) return res.status(404).json(error('Notification not found'))

    const updated = await db.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    })
    res.json(success(updated, 'Notification marked as read'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/notifications/read-all — mark all of the user's notifications as read
notificationsRouter.put('/read-all', requireAuth, async (req, res) => {
  try {
    const result = await db.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    })
    res.json(success({ count: result.count }, `${result.count} notification(s) marked as read`))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
