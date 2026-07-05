import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { getPagination, listResponse } from '@/lib/admin-api'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'
import { startSpan } from '@/lib/monitoring'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createOrderSchema = z.object({
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
}).passthrough()

// ─── GET /api/admin/orders ────────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const { page, limit, skip, search } = getPagination(request.url)
  const url = new URL(request.url)
  const rawStatus = url.searchParams.get('status')
  const rawPaymentStatus = url.searchParams.get('paymentStatus')
  // Normalise to UPPERCASE so "pending" from the UI matches "PENDING" in DB.
  const status = rawStatus && rawStatus !== 'all' ? rawStatus.toUpperCase() : undefined
  const paymentStatus = rawPaymentStatus && rawPaymentStatus !== 'all' ? rawPaymentStatus.toUpperCase() : undefined

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

  const span = startSpan('admin.orders.list')
  try {
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

    return listResponse(orders, total, page, limit)
  } finally {
    span.finish()
  }
})

// ─── POST /api/admin/orders ───────────────────────────────────────────────────

export const POST = adminRoute(createOrderSchema, async (request, body, user) => {
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
    return errorResponse('paymentMethod is required', 400)
  }
  if (total === undefined || total === null) {
    return errorResponse('total is required', 400)
  }
  if (!Array.isArray(items) || items.length === 0) {
    return errorResponse('At least one order item is required', 400)
  }

  // Generate order number: EPF-YYMMDD-XXXX
  const now = new Date()
  const yy = String(now.getFullYear()).slice(2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const rand = String(Math.floor(1000 + Math.random() * 9000))
  const orderNumber = `EPF-${yy}${mm}${dd}-${rand}`

  // Persist shippingAddress as JSON inside notes if no explicit notes given.
  const notesValue =
    notes ??
    (shippingAddress ? JSON.stringify(shippingAddress) : null)

  const order = await db.$transaction(async (tx) => {
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

    // Create order items
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

    // Initial OrderHistory entry
    await tx.orderHistory.create({
      data: {
        orderId: created.id,
        userId: user.id,
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

  return jsonResponse({ data: order }, 201)
})
