import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  jsonResponse,
  errorResponse,
  requireAuth,
} from '@/lib/auth'
import { parseJsonField } from '@/lib/admin-api'
import { publicRoute, publicGetRoute, authGetRoute, z } from '@/lib/api-handler'
import { startSpan } from '@/lib/monitoring'
import { notifyAdmins } from '@/lib/notifications'

function orderNumber(seq: number, rand: number = 0): string {
  const d = new Date()
  const ymd =
    `${d.getFullYear()}` +
    `${String(d.getMonth() + 1).padStart(2, '0')}` +
    `${String(d.getDate()).padStart(2, '0')}`
  // Include a random suffix to avoid collisions under concurrent inserts.
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

// ─── GET: List user's orders ──────────────────────────────────────────────────

export const GET = authGetRoute(async (request, user) => {
  const url = new URL(request.url)
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))

  const orders = await db.order.findMany({
    where: { userId: user.id },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  })

  return jsonResponse({ data: orders })
})

// ─── POST: Create order ───────────────────────────────────────────────────────

export const POST = publicRoute(createOrderSchema, async (request, parsed) => {
  const {
    customerName,
    customerPhone,
    customerEmail,
    address,
    area,
    notes,
    couponCode,
    paymentMethod,
    items,
  } = parsed

  // Resolve each line item to a price + name + image.
  const lineItems = []
  let subtotal = 0

  for (const item of items) {
    const qty = Math.max(1, item.quantity)
    let unitPrice = 0
    let productName = ''
    let productImage: string | null = null
    let variantName: string | null = null

    if (item.itemType === 'SERVICE') {
      const service = await db.service.findUnique({ where: { id: item.serviceId! } })
      if (!service) {return errorResponse('Service not found', 400)}
      unitPrice = service.basePrice
      productName = service.name
      const imgs = parseJsonField(service.images)
      productImage = imgs[0] || null
    } else if (item.itemType === 'PROJECT') {
      const kit = await db.projectKit.findUnique({ where: { id: item.projectId! } })
      if (!kit) {return errorResponse('Project kit not found', 400)}
      if (!kit.isActive) {return errorResponse('Kit is not available', 400)}
      unitPrice = kit.salePrice ?? kit.price ?? 0
      productName = kit.title
      productImage = kit.coverImage || parseJsonField(kit.images)[0] || null
    } else {
      const product = await db.product.findUnique({
        where: { id: item.productId! },
        include: { variants: true },
      })
      if (!product) {return errorResponse('Product not found', 400)}
      if (item.variantId) {
        const variant = product.variants.find((v: any) => v.id === item.variantId)
        if (!variant) {return errorResponse('Variant not found', 400)}
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

  const isInsideDhaka = area && /dhaka|ঢাকা/i.test(area)
  let deliveryCharge = isInsideDhaka ? insideDhakaRate : outsideDhakaRate
  if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold) {
    deliveryCharge = 0
  }

  // Coupon discount — applied on subtotal only (matches client-side calculation
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
          if (coupon.maxDiscount !== null) {discount = Math.min(discount, coupon.maxDiscount)}
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

  // Attach to the logged-in user if present (guests may order too).
  const auth = await requireAuth()

  // Generate a unique order number.
  // M23: pure count-based numbers can collide under concurrent inserts.
  // Use a date+random suffix to make collisions effectively impossible
  // without needing a unique constraint migration.
  const seqHint = await db.order.count({
    where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
  })
  const rand = Math.floor(1000 + Math.random() * 9000)
  const newOrderNumber = orderNumber(seqHint + 1, rand)

  const span = startSpan('orders.create')
  const order = await db.order.create({
    data: {
      orderNumber: newOrderNumber,
      userId: auth.ok ? auth.user!.id : null,
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
  span.finish()

  // Record an initial history entry.
  await db.orderHistory.create({
    data: {
      orderId: order.id,
      userId: auth.ok ? auth.user!.id : null,
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
    order.id,
  )

  return jsonResponse(
    { success: true, data: order, message: 'Order created successfully' },
    201,
  )
})
