import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/auth'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'
import { notifyAdmins } from '@/lib/notifications'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createReturnSchema = z.object({
  reason: z.string().min(1),
}).passthrough()

// ─── POST /api/orders/[id]/return ─────────────────────────────────────────────

export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAuth()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, createReturnSchema)

  const reason = (body.reason || '').trim()
  if (!reason) {return errorResponse('reason is required', 400)}

  // The order must belong to the requesting user.
  const order = await db.order.findUnique({ where: { id } })
  if (!order) {return errorResponse('Order not found', 404)}
  if (order.userId !== auth.user!.id) {return errorResponse('Forbidden', 403)}

  // Only allow returns for orders that have been delivered or confirmed.
  if (!['DELIVERED', 'CONFIRMED'].includes(order.status)) {
    return errorResponse('This order cannot be returned in its current status', 400)
  }

  const existing = await db.returnRequest.findFirst({
    where: { orderId: id, userId: auth.user!.id },
  })
  if (existing) {return errorResponse('Return request already exists for this order', 409)}

  const returnRequest = await db.returnRequest.create({
    data: {
      orderId: id,
      userId: auth.user!.id,
      reason,
      status: 'PENDING',
      refundAmount: order.total,
    },
  })

  // Notify all admins that a return request was submitted.
  await notifyAdmins(
    'Return Request Submitted',
    `A return request was submitted for order ${order.orderNumber} (৳${order.total}).`,
    'RETURN',
    returnRequest.id,
  )

  return jsonResponse({ data: returnRequest, message: 'Return request submitted' }, 201)
})
