// Order routes: list, create, track, return request
// Migrated from apps/web/src/app/api/orders/* (Next.js route handlers → Express).
//
// Source files:
//   apps/web/src/app/api/orders/route.ts            → GET /, POST /
//   apps/web/src/app/api/orders/track/route.ts      → GET /track
//   apps/web/src/app/api/orders/[id]/return/route.ts → POST /:id/return

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import {
  requireAuth,
  optionalAuth,
  getAuthUser,
  type SessionUser,
} from '../lib/auth.js'
import { parseJsonField } from '../lib/helpers.js'

const router = Router()

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fire-and-forget: notify all active admin users of an event.
 * Mirrors apps/web/src/lib/notifications.ts → notifyAdmins.
 * Errors are swallowed so a notification failure never breaks the parent flow.
 */
async function notifyAdmins(
  title: string,
  message: string,
  type: string = 'INFO',
  relatedId?: string,
): Promise<void> {
  try {
    const admins = await db.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    })
    if (admins.length === 0) return

    await db.notification.createMany({
      data: admins.map((a: any) => ({
        userId: a.id,
        title,
        message,
        type,
        relatedId: relatedId || null,
      })),
    })
  } catch (err) {
    console.error('[notifications] failed to notify admins:', err)
  }
}

/**
 * Builds a human-readable order number with a date prefix and a random
 * suffix to avoid collisions under concurrent inserts.
 *   EPF-YYYYMMDD-NNNN-RAND
 */
function orderNumber(seq: number, rand: number = 0): string {
  const d = new Date()
  const ymd =
    `${d.getFullYear()}` +
    `${String(d.getMonth() + 1).padStart(2, '0')}` +
    `${String(d.getDate()).padStart(2, '0')}`
  return rand > 0
    ? `EPF-${ymd}-${String(seq).padStart(4, '0')}-${rand}`
    : `EPF-${ymd}-${String(seq).padStart(4, '0')}`
}

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const orderItemSchema = z.object({
  itemType: z.enum(['PRODUCT', 'SERVICE', 'PROJECT']).default('PRODUCT'),
  productId: z.string().optional(),
  serviceId: z.string().optional(),
  projectId: z.string().optional(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
})

const createOrderSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().min(6).max(20),
  customerEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().min(1).max(500),
  area: z.string().optional(),
  notes: z.string().max(2000).optional(),
  couponCode: z.string().max(50).optional(),
  paymentMethod: z.string().min(1),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
})

const createReturnSchema = z
  .object({
    reason: z.string().min(1),
  })
  .passthrough()

// ─── GET /api/orders — list current user's orders ─────────────────────────────

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const limit = Math.min(
      50,
      Math.max(1, parseInt((req.query.limit as string) || '20', 10))
    )

    const orders = await db.order.findMany({
      where: { userId: user.id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    })

    res.json({ data: orders })
  })
)

// ─── GET /api/orders/track — public order tracking ────────────────────────────
// IMPORTANT: declared before /:id so the literal path isn't shadowed.

router.get(
  '/track',
  asyncHandler(async (req, res) => {
    const orderNumber =
      typeof req.query.orderNumber === 'string' ? req.query.orderNumber.trim() : ''
    const phone =
      typeof req.query.phone === 'string' ? req.query.phone.trim() : ''

    if (!orderNumber || !phone) {
      throw new ApiError('orderNumber and phone are required', 400)
    }

    const order = await db.order.findFirst({
      where: { orderNumber, customerPhone: phone },
      include: { items: true },
    })

    if (!order) {
      throw new ApiError('Order not found', 404)
    }

    const histories = await db.orderHistory.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: 'asc' },
    })

    res.json({
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        total: order.total,
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        discount: order.discount,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        createdAt: order.createdAt,
        items: order.items,
        histories,
      },
    })
  })
)

// ─── POST /api/orders — create order (public; attaches to user if logged in) ──

router.post(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const {
      customerName,
      customerPhone,
      customerEmail,
      area,
      notes,
      couponCode,
      paymentMethod,
      items,
    } = validateBody(req, createOrderSchema)

    // optionalAuth attaches the user if a valid session exists; otherwise we
    // proceed as a guest checkout (userId = null).
    const authUser = getAuthUser(req) as SessionUser | undefined
    const userId = authUser?.id ?? null

    // Resolve each line item to a price + name + image.
    const lineItems: any[] = []
    let subtotal = 0

    for (const item of items) {
      const qty = Math.max(1, item.quantity)
      let unitPrice = 0
      let productName = ''
      let productImage: string | null = null
      let variantName: string | null = null

      if (item.itemType === 'SERVICE') {
        const service = await db.service.findUnique({ where: { id: item.serviceId! } })
        if (!service) throw new ApiError('Service not found', 400)
        unitPrice = service.basePrice
        productName = service.name
        const imgs = parseJsonField(service.images)
        productImage = imgs[0] || null
      } else if (item.itemType === 'PROJECT') {
        const kit = await db.projectKit.findUnique({ where: { id: item.projectId! } })
        if (!kit) throw new ApiError('Project kit not found', 400)
        if (!kit.isActive) throw new ApiError('Kit is not available', 400)
        unitPrice = kit.salePrice ?? kit.price ?? 0
        productName = kit.title
        productImage = kit.coverImage || parseJsonField(kit.images)[0] || null
      } else {
        const product = await db.product.findUnique({
          where: { id: item.productId! },
          include: { variants: true },
        })
        if (!product) throw new ApiError('Product not found', 400)
        if (item.variantId) {
          const variant = product.variants.find((v: any) => v.id === item.variantId)
          if (!variant) throw new ApiError('Variant not found', 400)
          unitPrice = variant.salePrice ?? variant.price
          variantName = variant.name
        } else {
          unitPrice = product.salePrice ?? product.price
        }
        productName = product.name
        const imgs = parseJsonField(product.images)
        productImage = imgs[0] || null
      }

      const lineTotal = unitPrice * qty
      subtotal += lineTotal
      lineItems.push({
        itemType: item.itemType,
        productId: item.productId || null,
        variantId: item.variantId || null,
        serviceId: item.serviceId || null,
        projectId: item.projectId || null,
        productName,
        productImage,
        variantName,
        price: unitPrice,
        quantity: qty,
        total: lineTotal,
      })
    }

    // Delivery charge — read from site settings; fall back to defaults.
    let siteSettings: any = null
    try {
      siteSettings = await db.siteSettings.findUnique({ where: { id: 'default' } })
    } catch {
      // ignore — use defaults
    }
    const insideDhakaRate = siteSettings?.shippingInsideDhaka ?? 60
    const outsideDhakaRate = siteSettings?.shippingOutsideDhaka ?? 120
    const freeShippingThreshold = siteSettings?.freeShippingThreshold ?? 0

    const isInsideDhaka = !!(area && /dhaka|ঢাকা/i.test(area as string))
    let deliveryCharge = isInsideDhaka ? insideDhakaRate : outsideDhakaRate
    if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
      deliveryCharge = 0
    }

    // Coupon discount — applied on subtotal only (matches client-side calc
    // in checkout/page.tsx and CheckoutDialog.tsx).
    let discount = 0
    let couponId: string | null = null
    if (couponCode) {
      const coupon = await db.coupon.findFirst({
        where: { code: couponCode.toUpperCase(), isActive: true },
      })
      if (coupon) {
        const now = new Date()
        if (now >= coupon.startDate && now <= coupon.endDate) {
          if (coupon.type === 'PERCENTAGE') {
            discount = (subtotal * coupon.value) / 100
            if (coupon.maxDiscount !== null) {
              discount = Math.min(discount, coupon.maxDiscount)
            }
          } else {
            discount = coupon.value
          }
          // Discount cannot exceed the subtotal (delivery is never discounted).
          discount = Math.min(discount, subtotal)
          couponId = coupon.id
        }
      }
    }

    // Total cannot go negative even if discount somehow exceeds subtotal + delivery.
    const total = Math.max(0, subtotal + deliveryCharge - discount)

    // Generate a unique order number.
    // Pure count-based numbers can collide under concurrent inserts; a
    // date+random suffix makes collisions effectively impossible without
    // needing a unique constraint migration.
    const seqHint = await db.order.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    })
    const rand = Math.floor(1000 + Math.random() * 9000)
    const newOrderNumber = orderNumber(seqHint + 1, rand)

    const order = await db.order.create({
      data: {
        orderNumber: newOrderNumber,
        userId,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        subtotal,
        deliveryCharge,
        discount,
        taxAmount: 0,
        total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod,
        couponId,
        notes: notes || null,
        items: { create: lineItems },
      },
      include: { items: true },
    })

    // Record an initial history entry.
    await db.orderHistory.create({
      data: {
        orderId: order.id,
        userId,
        status: 'PENDING',
        note: 'Order placed',
      },
    })

    // Increment coupon usage if applied.
    if (couponId) {
      await db.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      })
    }

    // Notify all admins about the new order (shows up in the admin bell icon).
    await notifyAdmins(
      'New Order Placed',
      `Order ${order.orderNumber} (৳${order.total}) has been placed by ${customerName}.`,
      'ORDER',
      order.id
    )

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully',
    })
  })
)

// ─── POST /api/orders/:id/return — request a return for an order ──────────────

router.post(
  '/:id/return',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const { id } = req.params
    const body = validateBody(req, createReturnSchema)

    const reason = (body.reason || '').trim()
    if (!reason) throw new ApiError('reason is required', 400)

    // The order must belong to the requesting user.
    const order = await db.order.findUnique({ where: { id } })
    if (!order) throw new ApiError('Order not found', 404)
    if (order.userId !== user.id) throw new ApiError('Forbidden', 403)

    // Only allow returns for orders that have been delivered or confirmed.
    if (!['DELIVERED', 'CONFIRMED'].includes(order.status)) {
      throw new ApiError('This order cannot be returned in its current status', 400)
    }

    const existing = await db.returnRequest.findFirst({
      where: { orderId: id, userId: user.id },
    })
    if (existing) {
      throw new ApiError('Return request already exists for this order', 409)
    }

    const returnRequest = await db.returnRequest.create({
      data: {
        orderId: id,
        userId: user.id,
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
      returnRequest.id
    )

    res.status(201).json({ data: returnRequest, message: 'Return request submitted' })
  })
)

export default router
