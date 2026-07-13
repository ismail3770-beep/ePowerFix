// Review routes: public list (approved), authed create, "mine"
import { Router } from 'express'
import { z } from 'zod'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import { getPagination, listResponse } from '../lib/helpers.js'
import { requireAuth, getAuthUser } from '../lib/auth.js'
import { schemas } from '../lib/schemas.js'

const router = Router()

// ─── GET /api/reviews ─────────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const productId = query.productId || undefined
    const serviceId = query.serviceId || undefined
    const { page, limit, skip } = getPagination(query)

    const where: any = { status: 'APPROVED' }
    if (productId) where.productId = productId
    if (serviceId) where.serviceId = serviceId

    // M18: When no filter is provided, don't dump the entire reviews table —
    // cap to a small "recent reviews" slice.
    const effectiveLimit = productId || serviceId ? limit : Math.min(limit, 20)

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        skip,
        take: effectiveLimit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, avatar: true } } },
      }),
      db.review.count({ where }),
    ])

    res.json(listResponse(reviews, total, page, effectiveLimit))
  })
)

// ─── GET /api/reviews/mine ────────────────────────────────────────────────────

router.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)

    const reviews = await db.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    })

    res.json({ data: reviews })
  })
)

// ─── POST /api/reviews ────────────────────────────────────────────────────────

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = validateBody(req, schemas.review)
    const user = getAuthUser(req)

    const { productId, serviceId, rating, title, comment } = body

    if (!productId && !serviceId) {
      throw new ApiError('productId or serviceId is required', 400)
    }

    const review = await db.review.create({
      data: {
        userId: user.id,
        productId: productId || null,
        serviceId: serviceId || null,
        rating,
        title,
        comment,
        status: 'PENDING',
      },
    })

    res.status(201).json({
      data: review,
      message: 'Review submitted — pending approval',
    })
  })
)

export default router
