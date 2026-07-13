// Admin review routes: list, get, update, delete.
// Migrated from apps/web/src/app/api/admin/reviews/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/reviews

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  getPagination,
  listResponse,
} from '../../lib/helpers.js'

const router = Router()

const REVIEW_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  product: { select: { id: true, name: true } },
  service: { select: { id: true, name: true } },
}

const updateReviewSchema = z
  .object({
    status: z.string().optional(),
    title: z.string().optional(),
    comment: z.string().optional(),
    rating: z.number().int().optional(),
    adminReply: z.string().optional(),
  })
  .passthrough()

// ─── GET /api/admin/reviews ──────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)
    const rawStatus = query.status
    const status =
      rawStatus && rawStatus !== 'all' ? String(rawStatus).toUpperCase() : undefined
    const productId = query.productId || undefined
    const serviceId = query.serviceId || undefined

    const where: any = {}
    if (status) where.status = status
    if (productId) where.productId = productId
    if (serviceId) where.serviceId = serviceId
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { comment: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { product: { name: { contains: search } } },
        { service: { name: { contains: search } } },
      ]
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: REVIEW_INCLUDE,
      }),
      db.review.count({ where }),
    ])

    res.json(listResponse(reviews, total, page, limit))
  })
)

// ─── GET /api/admin/reviews/:id ──────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const review = await db.review.findUnique({
      where: { id },
      include: REVIEW_INCLUDE,
    })
    if (!review) {
      throw new ApiError('Review not found', 404)
    }
    res.json({ data: review })
  })
)

// ─── PUT /api/admin/reviews/:id ──────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateReviewSchema)

    const existing = await db.review.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Review not found', 404)
    }

    const data: any = {}
    if (body.status !== undefined) {
      const allowed = ['PENDING', 'APPROVED', 'REJECTED']
      if (!allowed.includes(body.status)) {
        throw new ApiError(`status must be one of ${allowed.join(', ')}`, 400)
      }
      data.status = body.status
    }
    if (body.title !== undefined) data.title = body.title
    if (body.comment !== undefined) data.comment = body.comment
    if (body.rating !== undefined) {
      const r = Number(body.rating)
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        throw new ApiError('rating must be an integer between 1 and 5', 400)
      }
      data.rating = r
    }
    // adminReply is not a schema field; ignored.

    const review = await db.review.update({
      where: { id },
      data,
      include: REVIEW_INCLUDE,
    })

    res.json({ data: review })
  })
)

// ─── DELETE /api/admin/reviews/:id ───────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.review.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Review not found', 404)
    }

    await db.review.update({
      where: { id },
      data: { isDeleted: true },
    })

    res.json({ message: 'Review deleted' })
  })
)

export default router
