import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/auth'
import { getPagination, listResponse } from '@/lib/admin-api'
import { publicRoute, publicGetRoute, authRoute, schemas } from '@/lib/api-handler'

/**
 * GET /api/reviews?productId=<id>
 * Public list of approved reviews for a product.
 */
export const GET = publicGetRoute(async (request) => {
  const url = new URL(request.url)
  const productId = url.searchParams.get('productId')
  const serviceId = url.searchParams.get('serviceId')
  const { page, limit, skip } = getPagination(request.url)

  const where: any = { status: 'APPROVED' }
  if (productId) where.productId = productId
  if (serviceId) where.serviceId = serviceId

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, avatar: true } } },
    }),
    db.review.count({ where }),
  ])

  return listResponse(reviews, total, page, limit)
})

/**
 * POST /api/reviews
 * Submit a review (requires auth). Zod-validated.
 */
export const POST = authRoute(schemas.review, async (request, { productId, serviceId, rating, title, comment }, user) => {
  if (!productId && !serviceId) {
    return errorResponse('productId or serviceId is required', 400)
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

  return jsonResponse({ data: review, message: 'Review submitted — pending approval' }, 201)
})
