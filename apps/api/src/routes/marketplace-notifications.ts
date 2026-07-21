import { Router } from 'express'

import { ApiError, asyncHandler } from '../lib/api-handler.js'
import { getAuthUser, requireAuth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import { getPagination, listResponse } from '../lib/helpers.js'

const router = Router()

router.use(requireAuth)

router.get('/', asyncHandler(async (req, res) => {
  const user = getAuthUser(req)
  const query = req.query as Record<string, string | undefined>
  const { page, limit, skip } = getPagination(query)
  const unreadOnly = query.unreadOnly === 'true'
  if (query.unreadOnly && !['true', 'false'].includes(query.unreadOnly)) {
    throw new ApiError('unreadOnly must be true or false', 400)
  }

  const where = {
    userId: user.id,
    channel: 'IN_APP',
    ...(unreadOnly ? { readAt: null } : {}),
  }
  const [notifications, total, unreadCount] = await Promise.all([
    db.notificationDelivery.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        template: true,
        title: true,
        message: true,
        payload: true,
        status: true,
        entityType: true,
        entityId: true,
        deliveredAt: true,
        readAt: true,
        createdAt: true,
      },
    }),
    db.notificationDelivery.count({ where }),
    db.notificationDelivery.count({
      where: { userId: user.id, channel: 'IN_APP', readAt: null },
    }),
  ])

  res.json({
    ...listResponse(notifications, total, page, limit),
    unreadCount,
  })
}))

router.put('/read-all', asyncHandler(async (req, res) => {
  const user = getAuthUser(req)
  const result = await db.notificationDelivery.updateMany({
    where: { userId: user.id, channel: 'IN_APP', readAt: null },
    data: { readAt: new Date() },
  })
  res.json({ data: { updatedCount: result.count } })
}))

const markReadHandler = asyncHandler(async (req, res) => {
  const user = getAuthUser(req)
  const id = String(req.params.id)
  const notification = await db.notificationDelivery.findFirst({
    where: { id, userId: user.id, channel: 'IN_APP' },
    select: { id: true, readAt: true },
  })
  if (!notification) throw new ApiError('Marketplace notification not found', 404)

  if (!notification.readAt) {
    const claim = await db.notificationDelivery.updateMany({
      where: { id, userId: user.id, channel: 'IN_APP', readAt: null },
      data: { readAt: new Date() },
    })
    if (claim.count !== 1) {
      const current = await db.notificationDelivery.findFirst({
        where: { id, userId: user.id, channel: 'IN_APP' },
        select: { id: true },
      })
      if (!current) throw new ApiError('Marketplace notification not found', 404)
    }
  }

  res.json({
    data: await db.notificationDelivery.findFirst({
      where: { id, userId: user.id, channel: 'IN_APP' },
    }),
  })
})

router.put('/:id/read', markReadHandler)
router.post('/:id/read', markReadHandler)

export default router
