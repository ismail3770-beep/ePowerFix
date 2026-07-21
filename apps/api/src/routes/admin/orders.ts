// Admin order routes: list, create, get, update, delete, status update.
// Mounted at /api/admin/orders. The parent router enforces requireAdmin.

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import { getPagination, listResponse } from '../../lib/helpers.js'
import { getAuthUser } from '../../lib/auth.js'
import { releaseOrderReservation } from '../../lib/order-reservations.js'

const router = Router()

const ORDER_ITEM_INCLUDE = {
  include: {
    project: { select: { id: true, title: true, slug: true, coverImage: true } },
    projectKit: { select: { id: true, title: true, slug: true, coverImage: true } },
  },
}

const createOrderSchema = z
  .object({
    userId: z.string().optional(),
    items: z.array(z.any()).optional(),
    subtotal: z.number().optional(),
    shipping: z.number().optional(),
    tax: z.number().optional(),
    discount: z.number().optional(),
    total: z.number().nullable().optional(),
    paymentMethod: z.string().optional(),
    paymentStatus: z.string().optional(),
    shippingAddress: z.any().optional(),
    status: z.string().optional(),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    customerEmail: z.string().optional(),
    notes: z.string().optional(),
  })
  .passthrough()

const updateOrderSchema = z
  .object({
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    internalNotes: z.string().optional(),
    notes: z.string().optional(),
    trackingNumber: z.string().optional(),
    carrier: z.string().optional(),
  })
  .passthrough()

const updateOrderStatusSchema = z
  .object({
    status: z.string().min(1),
    note: z.string().max(500).optional(),
  })
  .passthrough()

function requestParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

function normalizeStatus(value: string | undefined): string | undefined {
  return value === undefined ? undefined : value.trim().toUpperCase()
}

// Fire-and-forget notification helper.
async function notifyUser(
  userId: string,
  title: string,
  message: string,
  type: string = 'INFO',
  relatedId?: string,
): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        relatedId: relatedId || null,
      },
    })
  } catch {
    // Swallow — never break the parent flow.
  }
}

// ─── GET /api/admin/orders ──────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)
    const rawStatus = query.status
    const rawPaymentStatus = query.paymentStatus
    const status =
      rawStatus && rawStatus !== 'all' ? String(rawStatus).toUpperCase() : undefined
    const paymentStatus =
      rawPaymentStatus && rawPaymentStatus !== 'all'
        ? String(rawPaymentStatus).toUpperCase()
        : undefined

    const where: any = {}
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { customerEmail: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ]
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: ORDER_ITEM_INCLUDE,
        },
      }),
      db.order.count({ where }),
    ])

    res.json(listResponse(orders, total, page, limit))
  }),
)

// ─── POST /api/admin/orders ─────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createOrderSchema)
    const authUser = getAuthUser(req)

    const {
      userId,
      items = [],
      subtotal = 0,
      shipping = 0,
      tax = 0,
      discount = 0,
      total,
      paymentMethod,
      paymentStatus = 'PENDING',
      shippingAddress,
      status = 'PENDING',
      customerName,
      customerPhone,
      customerEmail,
      notes,
    } = body

    if (!paymentMethod) throw new ApiError('paymentMethod is required', 400)
    if (total === undefined || total === null) throw new ApiError('total is required', 400)
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError('At least one order item is required', 400)
    }

    const now = new Date()
    const yy = String(now.getFullYear()).slice(2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const rand = String(Math.floor(1000 + Math.random() * 9000))
    const orderNumber = `EPF-${yy}${mm}${dd}-${rand}`

    const notesValue = notes ?? (shippingAddress ? JSON.stringify(shippingAddress) : null)

    const order = await (db as any).$transaction(async (tx: any) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: userId || null,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          customerEmail: customerEmail || null,
          subtotal: Number(subtotal) || 0,
          deliveryCharge: Number(shipping) || 0,
          discount: Number(discount) || 0,
          taxAmount: Number(tax) || 0,
          total: Number(total) || 0,
          status,
          paymentStatus,
          paymentMethod,
          notes: notesValue,
        },
      })

      await tx.orderItem.createMany({
        data: items.map((item: any) => {
          const itemType =
            item.itemType === 'PROJECT_KIT' || item.projectKitId
              ? 'PROJECT_KIT'
              : item.itemType || 'PRODUCT'

          return {
            orderId: created.id,
            productId: item.productId || null,
            productName: item.name || item.productName || 'Item',
            productImage: item.image || item.productImage || null,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            total: (Number(item.price) || 0) * (Number(item.quantity) || 1),
            itemType,
            variantId: item.variantId || null,
            serviceId: item.serviceId || null,
            projectId: itemType === 'PROJECT' ? item.projectId || null : null,
            projectKitId:
              itemType === 'PROJECT_KIT'
                ? item.projectKitId || item.projectId || null
                : null,
            variantName: item.variantName || null,
          }
        }),
      })

      await tx.orderHistory.create({
        data: {
          orderId: created.id,
          userId: authUser.id,
          status,
          note: 'Order created by admin',
        },
      })

      return tx.order.findUnique({
        where: { id: created.id },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: ORDER_ITEM_INCLUDE,
          histories: true,
        },
      })
    })

    res.status(201).json({ data: order })
  }),
)

// ─── GET /api/admin/orders/:id ───────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = requestParam(req.params.id)

    const order = await db.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: ORDER_ITEM_INCLUDE,
        histories: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        address: true,
        shipment: true,
      },
    })

    if (!order) throw new ApiError('Order not found', 404)
    res.json({ data: order })
  }),
)

// ─── PUT /api/admin/orders/:id ───────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = requestParam(req.params.id)
    const body = validateBody(req, updateOrderSchema)
    const authUser = getAuthUser(req)

    const existing = await db.order.findUnique({
      where: { id },
      include: { shipment: true },
    })
    if (!existing) throw new ApiError('Order not found', 404)

    const requestedStatus = normalizeStatus(body.status)
    const requestedPaymentStatus = normalizeStatus(body.paymentStatus)
    const { internalNotes, notes, trackingNumber, carrier } = body

    const baseData: any = {}
    if (requestedStatus !== undefined) baseData.status = requestedStatus
    if (requestedPaymentStatus !== undefined) baseData.paymentStatus = requestedPaymentStatus
    if (internalNotes !== undefined) baseData.notes = internalNotes
    else if (notes !== undefined) baseData.notes = notes

    if (requestedStatus === 'DELIVERED' && !existing.deliveredAt) {
      baseData.deliveredAt = new Date()
    }

    const order = await (db as any).$transaction(async (tx: any) => {
      let reservationReleased = false
      if (requestedStatus === 'CANCELLED' && existing.status !== 'CANCELLED') {
        const release = await releaseOrderReservation(tx, id, 'ADMIN_CANCELLED')
        reservationReleased = release.released
      }

      const data = { ...baseData }
      // A successful reservation release sets the canonical cancellation state;
      // do not allow a simultaneous arbitrary paymentStatus body field to undo it.
      if (reservationReleased) data.paymentStatus = 'CANCELLED'

      const updated = await tx.order.update({
        where: { id },
        data,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: ORDER_ITEM_INCLUDE,
          histories: {
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      })

      if (requestedStatus !== undefined && requestedStatus !== existing.status && !reservationReleased) {
        await tx.orderHistory.create({
          data: {
            orderId: id,
            userId: authUser.id,
            status: requestedStatus,
            note: `Status updated from ${existing.status} to ${requestedStatus}`,
          },
        })
      }

      if (trackingNumber !== undefined) {
        await tx.shipment.upsert({
          where: { orderId: id },
          create: {
            orderId: id,
            trackingNumber: trackingNumber || null,
            carrier: carrier || null,
            status: requestedStatus === 'SHIPPED' ? 'SHIPPED' : 'PENDING',
            shippedAt: requestedStatus === 'SHIPPED' ? new Date() : null,
          },
          update: {
            trackingNumber: trackingNumber || null,
            carrier: carrier || existing.shipment?.carrier || null,
            status: requestedStatus === 'SHIPPED' ? 'SHIPPED' : undefined,
            shippedAt: requestedStatus === 'SHIPPED' ? new Date() : undefined,
          },
        })
      }

      return updated
    })

    res.json({ data: order })
  }),
)

// ─── DELETE /api/admin/orders/:id ────────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = requestParam(req.params.id)

    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) throw new ApiError('Order not found', 404)

    await (db as any).$transaction(async (tx: any) => {
      // Restore only an active online reservation before deleting the record.
      // The conditional helper makes repeat/delete races harmless.
      await releaseOrderReservation(tx, id, 'ADMIN_DELETED')
      await tx.orderItem.deleteMany({ where: { orderId: id } })
      await tx.orderHistory.deleteMany({ where: { orderId: id } })
      await tx.couponUsage.deleteMany({ where: { orderId: id } })
      await tx.shipment.deleteMany({ where: { orderId: id } })
      await tx.payment.deleteMany({ where: { orderId: id } })
      await tx.order.delete({ where: { id } })
    })

    res.json({ message: 'Order deleted' })
  }),
)

// ─── PUT /api/admin/orders/:id/status ────────────────────────────────────────

router.put(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const id = requestParam(req.params.id)
    const body = validateBody(req, updateOrderStatusSchema)
    const authUser = getAuthUser(req)

    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) throw new ApiError('Order not found', 404)

    const status = body.status.trim().toUpperCase()
    const baseData: any = { status }
    if (status === 'DELIVERED' && !existing.deliveredAt) {
      baseData.deliveredAt = new Date()
    }

    const order = await (db as any).$transaction(async (tx: any) => {
      let reservationReleased = false
      if (status === 'CANCELLED' && existing.status !== 'CANCELLED') {
        const release = await releaseOrderReservation(tx, id, 'ADMIN_CANCELLED')
        reservationReleased = release.released
      }

      const updated = await tx.order.update({
        where: { id },
        data: baseData,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: ORDER_ITEM_INCLUDE,
          histories: {
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { id: true, name: true, email: true } } },
          },
        },
      })

      if (status !== existing.status && !reservationReleased) {
        await tx.orderHistory.create({
          data: {
            orderId: id,
            userId: authUser.id,
            status,
            note: body.note || `Status updated from ${existing.status} to ${status}`,
          },
        })
      }

      return updated
    })

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

    res.json({ data: order })
  }),
)

export default router
