// Admin newsletter routes: list, get, delete.
// Migrated from apps/web/src/app/api/admin/newsletter/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/newsletter

import { Router } from 'express'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError } from '../../lib/api-handler.js'
import {
  getPagination,
  listResponse,
} from '../../lib/helpers.js'

const router = Router()

// ─── GET /api/admin/newsletter ───────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)
    const status = query.status || undefined

    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ]
    }
    if (status) where.status = String(status).toUpperCase()

    const [subscribers, total] = await Promise.all([
      db.newsletter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      db.newsletter.count({ where }),
    ])

    res.json(listResponse(subscribers, total, page, limit))
  })
)

// ─── GET /api/admin/newsletter/:id ───────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const subscriber = await db.newsletter.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    if (!subscriber) {
      throw new ApiError('Subscriber not found', 404)
    }
    res.json({ data: subscriber })
  })
)

// ─── DELETE /api/admin/newsletter/:id — hard delete ──────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.newsletter.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Subscriber not found', 404)
    }

    await db.newsletter.delete({ where: { id } })
    res.json({ message: 'Subscriber deleted' })
  })
)

export default router
