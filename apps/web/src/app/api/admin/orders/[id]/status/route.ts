import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'
import { notifyUser } from '@/lib/notifications'

const updateOrderStatusSchema = z.object({
  status: z.string().min(1),
  note: z.string().max(500).optional(),
}).passthrough()

/**
 * PUT /api/admin/orders/[id]/status
 * Update order status + create history entry.
 */
export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updateOrderStatusSchema)

  const existing = await db.order.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Order not found', 404)}

  // Normalise status to UPPERCASE to match DB values.
  const status = body.status.toUpperCase()
  const data: any = { status }
  if (status === 'DELIVERED' && !existing.deliveredAt) {
    data.deliveredAt = new Date()
  }

  const order = await db.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
        histories: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    })

    if (status !== existing.status) {
      await tx.orderHistory.create({
        data: {
          orderId: id,
          userId: auth.user!.id,
          status,
          note: body.note || `Status updated from ${existing.status} to ${status}`,
        },
      })
    }

    return updated
  })

  // Notify the customer that their order status changed (e.g. confirmed,
  // shipped, delivered, or cancelled). Only notify if the order belongs to
  // a registered user (guest orders have userId = null).
  if (order.userId && status !== existing.status) {
    const statusMessages: Record<string, string> = {
      PENDING: 'is pending confirmation',
      CONFIRMED: 'has been confirmed',
      PROCESSING: 'is being processed',
      SHIPPED: 'has been shipped',
      DELIVERED: 'has been delivered',
      CANCELLED: 'has been cancelled',
      RETURNED: 'return has been processed',
    }
    const detail = statusMessages[status] || `updated to ${status}`
    await notifyUser(
      order.userId,
      'Order Status Updated',
      `Your order ${order.orderNumber} ${detail}.`,
      'ORDER',
      order.id,
    )
  }

  return jsonResponse({ data: order })
})
