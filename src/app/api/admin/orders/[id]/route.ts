import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateOrderSchema = z.object({
  status: z.string().optional(),
  paymentStatus: z.string().optional(),
  internalNotes: z.string().optional(),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
}).passthrough()

// ─── GET /api/admin/orders/[id] ───────────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

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

  if (!order) {return errorResponse('Order not found', 404)}
  return jsonResponse({ data: order })
})

// ─── PUT /api/admin/orders/[id] ───────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updateOrderSchema)

  const existing = await db.order.findUnique({
    where: { id },
    include: { shipment: true },
  })
  if (!existing) {return errorResponse('Order not found', 404)}

  const {
    status,
    paymentStatus,
    internalNotes,
    notes,
    trackingNumber,
    carrier,
  } = body

  const data: any = {}
  if (status !== undefined) {data.status = status}
  if (paymentStatus !== undefined) {data.paymentStatus = paymentStatus}
  if (internalNotes !== undefined) {data.notes = internalNotes}
  else if (notes !== undefined) {data.notes = notes}

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
})

// ─── DELETE /api/admin/orders/[id] ────────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const existing = await db.order.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Order not found', 404)}

  await db.$transaction([
    db.orderItem.deleteMany({ where: { orderId: id } }),
    db.orderHistory.deleteMany({ where: { orderId: id } }),
    db.shipment.deleteMany({ where: { orderId: id } }),
    db.payment.deleteMany({ where: { orderId: id } }),
    db.order.delete({ where: { id } }),
  ])

  return jsonResponse({ message: 'Order deleted' })
})
