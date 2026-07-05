import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  jsonResponse,
  errorResponse,
  requireAuth,
  parseBody,
} from '@/lib/auth'
import { parseJsonField } from '@/lib/admin-api'

function orderNumber(seq: number): string {
  const d = new Date()
  const ymd =
    `${d.getFullYear()}` +
    `${String(d.getMonth() + 1).padStart(2, '0')}` +
    `${String(d.getDate()).padStart(2, '0')}`
  return `EPF-${ymd}-${String(seq).padStart(4, '0')}`
}

/**
 * GET /api/orders?limit=N
 * List the current user's orders (most recent first).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) return auth.response!

    const url = new URL(request.url)
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))

    const orders = await db.order.findMany({
      where: { userId: auth.user!.id },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
      },
    })

    const parsed = orders.map((o) => ({
      ...o,
      items: o.items.map((it: any) => ({
        ...it,
        productImage: it.productImage,
      })),
    }))

    return jsonResponse({ data: parsed })
  } catch (err: any) {
    console.error('public/orders GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/orders
 * Create a new order (guest or authenticated).
 * Body: {
 *   customerName, customerPhone, customerEmail?, address, area, notes?,
 *   couponCode?, paymentMethod, items: [{ itemType, productId?, serviceId?, projectId?, variantId?, quantity }]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

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
    } = body

    if (!customerName) return errorResponse('customerName is required', 400)
    if (!customerPhone) return errorResponse('customerPhone is required', 400)
    if (!address) return errorResponse('address is required', 400)
    if (!paymentMethod) return errorResponse('paymentMethod is required', 400)
    if (!Array.isArray(items) || items.length === 0)
      return errorResponse('items must be a non-empty array', 400)

    // Resolve each line item to a price + name + image.
    const lineItems = []
    let subtotal = 0
    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1)
      let unitPrice = 0
      let productName = ''
      let productImage: string | null = null
      let variantName: string | null = null

      const itemType = item.itemType || 'PRODUCT'

      if (itemType === 'SERVICE') {
        const service = await db.service.findUnique({ where: { id: item.serviceId } })
        if (!service) return errorResponse('Service not found', 400)
        unitPrice = service.salePrice ?? service.basePrice
        productName = service.name
        const imgs = parseJsonField(service.images)
        productImage = imgs[0] || null
      } else if (itemType === 'PROJECT') {
        const project = await db.project.findUnique({ where: { id: item.projectId } })
        if (!project) return errorResponse('Project not found', 400)
        unitPrice = project.salePrice ?? project.price ?? 0
        productName = project.title
        productImage = project.coverImage || parseJsonField(project.images)[0] || null
      } else {
        const product = await db.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        })
        if (!product) return errorResponse('Product not found', 400)
        if (item.variantId) {
          const variant = product.variants.find((v) => v.id === item.variantId)
          if (!variant) return errorResponse('Variant not found', 400)
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
        itemType,
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

    // Delivery charge — flat 60 inside Dhaka, 120 outside (simple heuristic).
    const fullAddress = `${address}, ${area || ''}`.toLowerCase()
    const isInsideDhaka = area && /dhaka|ঢাকা/i.test(area)
    const deliveryCharge = isInsideDhaka ? 60 : 120

    // Coupon discount
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
            if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount)
          } else {
            discount = coupon.value
          }
          discount = Math.min(discount, subtotal)
          couponId = coupon.id
        }
      }
    }

    const total = subtotal + deliveryCharge - discount

    // Attach to the logged-in user if present (guests may order too).
    const auth = await requireAuth()

    // Generate a unique order number.
    const countToday = await db.order.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    })
    const newOrderNumber = orderNumber(countToday + 1)

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

    return jsonResponse(
      { success: true, data: order, message: 'Order created successfully' },
      201,
    )
  } catch (err: any) {
    console.error('public/orders POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
