import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth, parseBody } from '@/lib/auth'
import { listResponse, getPagination } from '@/lib/admin-api'

/**
 * GET /api/reviews?productId=<id>
 * Public list of approved reviews for a product.
 */
export async function GET(request: NextRequest) {
  try {
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
  } catch (err: any) {
    console.error('public/reviews GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/reviews
 * Submit a review (requires auth). Status defaults to PENDING until approved.
 * Body: { productId?, serviceId?, rating, title, comment }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response!

    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const { productId, serviceId, rating, title, comment } = body
    if (!rating || rating < 1 || rating > 5) return errorResponse('rating (1-5) is required', 400)
    if (!title) return errorResponse('title is required', 400)
    if (!comment) return errorResponse('comment is required', 400)
    if (!productId && !serviceId) return errorResponse('productId or serviceId is required', 400)

    const review = await db.review.create({
      data: {
        userId: auth.user!.id,
        productId: productId || null,
        serviceId: serviceId || null,
        rating: Number(rating),
        title,
        comment,
        status: 'PENDING',
      },
    })

    return jsonResponse({ data: review, message: 'Review submitted — pending approval' }, 201)
  } catch (err: any) {
    console.error('public/reviews POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
