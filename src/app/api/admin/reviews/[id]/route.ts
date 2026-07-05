import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

const REVIEW_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  product: { select: { id: true, name: true } },
  service: { select: { id: true, name: true } },
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateReviewSchema = z.object({
  status: z.string().optional(),
  title: z.string().optional(),
  comment: z.string().optional(),
  rating: z.number().int().optional(),
  adminReply: z.string().optional(),
}).passthrough()

// ─── GET /api/admin/reviews/[id] ──────────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const review = await db.review.findUnique({
    where: { id },
    include: REVIEW_INCLUDE,
  })
  if (!review) return errorResponse('Review not found', 404)
  return jsonResponse({ data: review })
})

// ─── PUT /api/admin/reviews/[id] ──────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const body = await validateBody(request, updateReviewSchema)

  const existing = await db.review.findUnique({ where: { id } })
  if (!existing) return errorResponse('Review not found', 404)

  const data: any = {}
  if (body.status !== undefined) {
    const allowed = ['PENDING', 'APPROVED', 'REJECTED']
    if (!allowed.includes(body.status)) {
      return errorResponse(`status must be one of ${allowed.join(', ')}`, 400)
    }
    data.status = body.status
  }
  if (body.title !== undefined) data.title = body.title
  if (body.comment !== undefined) data.comment = body.comment
  if (body.rating !== undefined) {
    const r = Number(body.rating)
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return errorResponse('rating must be an integer between 1 and 5', 400)
    }
    data.rating = r
  }
  // adminReply is not a schema field; ignored.

  const review = await db.review.update({
    where: { id },
    data,
    include: REVIEW_INCLUDE,
  })

  return jsonResponse({ data: review })
})

// ─── DELETE /api/admin/reviews/[id] ───────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const existing = await db.review.findUnique({ where: { id } })
  if (!existing) return errorResponse('Review not found', 404)

  await db.review.update({
    where: { id },
    data: { isDeleted: true },
  })

  return jsonResponse({ message: 'Review deleted' })
})
