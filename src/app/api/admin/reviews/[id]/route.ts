import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

const REVIEW_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  product: { select: { id: true, name: true } },
  service: { select: { id: true, name: true } },
}

/**
 * GET /api/admin/reviews/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const review = await db.review.findUnique({
      where: { id },
      include: REVIEW_INCLUDE,
    })
    if (!review) return errorResponse('Review not found', 404)
    return jsonResponse({ data: review })
  } catch (err: any) {
    console.error('admin/reviews/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/reviews/[id]
 * Updates `status` ('PENDING'|'APPROVED'|'REJECTED') and/or editable fields
 * (title, comment, rating). The schema has no `adminReply` column, so that
 * field is silently ignored if sent.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

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
  } catch (err: any) {
    console.error('admin/reviews/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/reviews/[id] — soft-delete (Review has isDeleted).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.review.findUnique({ where: { id } })
    if (!existing) return errorResponse('Review not found', 404)

    await db.review.update({
      where: { id },
      data: { isDeleted: true },
    })

    return jsonResponse({ message: 'Review deleted' })
  } catch (err: any) {
    console.error('admin/reviews/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
