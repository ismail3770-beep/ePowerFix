import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth, parseBody } from '@/lib/auth'

/**
 * POST /api/orders/[id]/return
 * Create a return request for an order (requires auth + ownership).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response!

    const { id } = await params
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const reason = (body.reason || '').trim()
    if (!reason) return errorResponse('reason is required', 400)

    // The order must belong to the requesting user.
    const order = await db.order.findUnique({ where: { id } })
    if (!order) return errorResponse('Order not found', 404)
    if (order.userId !== auth.user!.id) return errorResponse('Forbidden', 403)

    const existing = await db.returnRequest.findFirst({
      where: { orderId: id, userId: auth.user!.id },
    })
    if (existing) return errorResponse('Return request already exists for this order', 409)

    const returnRequest = await db.returnRequest.create({
      data: {
        orderId: id,
        userId: auth.user!.id,
        reason,
        status: 'PENDING',
        refundAmount: order.total,
      },
    })

    return jsonResponse({ data: returnRequest, message: 'Return request submitted' }, 201)
  } catch (err: any) {
    console.error('public/orders/[id]/return POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
