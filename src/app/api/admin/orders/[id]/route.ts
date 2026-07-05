import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

/**
 * GET /api/admin/orders/[id]
 * Fetch a single order with user, items, and orderHistory relations.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
        histories: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        address: true,
        shipment: true,
      },
    })

    if (!order) return errorResponse('Order not found', 404)
    return jsonResponse({ data: order })
  } catch (err: any) {
    console.error('admin/orders/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/orders/[id]
 * Update order status / paymentStatus / internalNotes / trackingNumber.
 * Creates an OrderHistory entry when status changes.
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

    const existing = await db.order.findUnique({
      where: { id },
      include: { shipment: true },
    })
    if (!existing) return errorResponse('Order not found', 404)

    const {
      status,
      paymentStatus,
      internalNotes,
      notes,
      trackingNumber,
      carrier,
    } = body

    const data: any = {}
    if (status !== undefined) data.status = status
    if (paymentStatus !== undefined) data.paymentStatus = paymentStatus
    if (internalNotes !== undefined) data.notes = internalNotes
    else if (notes !== undefined) data.notes = notes

    // Mark delivered timestamp if status moved to DELIVERED
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

      // Create OrderHistory entry if status changed
      if (status !== undefined && status !== existing.status) {
        await tx.orderHistory.create({
          data: {
            orderId: id,
            userId: auth.user!.id,
            status,
            note: `Status updated from ${existing.status} to ${status}`,
          },
        })
      }

      // Upsert Shipment tracking info if trackingNumber provided
      if (trackingNumber !== undefined) {
        await tx.shipment.upsert({
          where: { orderId: id },
          create: {
            orderId: id,
            trackingNumber: trackingNumber || null,
            carrier: carrier || null,
            status: status === 'SHIPPED' ? 'SHIPPED' : 'PENDING',
            shippedAt: status === 'SHIPPED' ? new Date() : null,
          },
          update: {
            trackingNumber: trackingNumber || null,
            carrier: carrier || existing.shipment?.carrier || null,
            status: status === 'SHIPPED' ? 'SHIPPED' : undefined,
            shippedAt: status === 'SHIPPED' ? new Date() : undefined,
          },
        })
      }

      return updated
    })

    return jsonResponse({ data: order })
  } catch (err: any) {
    console.error('admin/orders/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/orders/[id]
 * Hard-delete an order along with its items and history.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) return errorResponse('Order not found', 404)

    await db.$transaction([
      db.orderItem.deleteMany({ where: { orderId: id } }),
      db.orderHistory.deleteMany({ where: { orderId: id } }),
      db.shipment.deleteMany({ where: { orderId: id } }),
      db.payment.deleteMany({ where: { orderId: id } }),
      db.order.delete({ where: { id } }),
    ])

    return jsonResponse({ message: 'Order deleted' })
  } catch (err: any) {
    console.error('admin/orders/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
