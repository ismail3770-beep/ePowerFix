// Admin order routes: list, create, get, update, delete, status update.
// Migrated from apps/web/src/app/api/admin/orders/route.ts, [id]/route.ts and [id]/status/route.ts.
//
// Mounted at /api/admin/orders

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  getPagination,
  listResponse,
} from '../../lib/helpers.js'
import { getAuthUser } from '../../lib/auth.js'

const router = Router()

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

// Fire-and-forget notification helper
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
    // Swallow — never break the parent flow
  }
}

// ─── GET /api/admin/orders ────────────────────────────────────────────────────

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
          items: true,
        },
      }),
      db.order.count({ where }),
    ])

    res.json(listResponse(orders, total, page, limit))
  })
)

// ─── POST /api/admin/orders ──────────────────────────────────────────────────

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

    if (!paymentMethod) {
      throw new ApiError('paymentMethod is required', 400)
    }
    if (total === undefined || total === null) {
      throw new ApiError('total is required', 400)
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new ApiError('At least one order item is required', 400)
    }

    const now = new Date()
    const yy = String(now.getFullYear()).slice(2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const rand = String(Math.floor(1000 + Math.random() * 9000))
    const orderNumber = `EPF-${yy}${mm}${dd}-${rand}`

    const notesValue =
      notes ?? (shippingAddress ? JSON.stringify(shippingAddress) : null)

    const order = await db.$transaction(async (tx: any) => {
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
        data: items.map((it: any) => ({
          orderId: created.id,
          productId: it.productId || null,
          productName: it.name || it.productName || 'Item',
          productImage: it.image || it.productImage || null,
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1,
          total: (Number(it.price) || 0) * (Number(it.quantity) || 1),
          itemType: it.itemType || 'PRODUCT',
          variantId: it.variantId || null,
          serviceId: it.serviceId || null,
          projectId: it.projectId || null,
          variantName: it.variantName || null,
        })),
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
          items: true,
          histories: true,
        },
      })
    })

    res.status(201).json({ data: order })
  })
)

// ─── GET /api/admin/orders/:id ───────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const order = await db.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
        histories: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        address: true,
        shipment: true,
      },
    })

    if (!order) {
      throw new ApiError('Order not found', 404)
    }
    res.json({ data: order })
  })
)

// ─── PUT /api/admin/orders/:id ───────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateOrderSchema)
    const authUser = getAuthUser(req)

    const existing = await db.order.findUnique({
      where: { id },
      include: { shipment: true },
    })
    if (!existing) {
      throw new ApiError('Order not found', 404)
    }

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

    if (status === 'DELIVERED' && !existing.deliveredAt) {
      data.deliveredAt = new Date()
    }

    const order = await db.$transaction(async (tx: any) => {
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

      if (status !== undefined && status !== existing.status) {
        await tx.orderHistory.create({
          data: {
            orderId: id,
            userId: authUser.id,
            status,
            note: `Status updated from ${existing.status} to ${status}`,
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

    res.json({ data: order })
  })
)

// ─── DELETE /api/admin/orders/:id ────────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Order not found', 404)
    }

    await db.$transaction([
      db.orderItem.deleteMany({ where: { orderId: id } }),
      db.orderHistory.deleteMany({ where: { orderId: id } }),
      db.shipment.deleteMany({ where: { orderId: id } }),
      db.payment.deleteMany({ where: { orderId: id } }),
      db.order.delete({ where: { id } }),
    ])

    res.json({ message: 'Order deleted' })
  })
)

// ─── PUT /api/admin/orders/:id/status ────────────────────────────────────────

router.put(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateOrderStatusSchema)
    const authUser = getAuthUser(req)

    const existing = await db.order.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Order not found', 404)
    }

    const status = body.status.toUpperCase()
    const data: any = { status }
    if (status === 'DELIVERED' && !existing.deliveredAt) {
      data.deliveredAt = new Date()
    }

    const order = await db.$transaction(async (tx: any) => {
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
  })
)

export default router
