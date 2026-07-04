import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'
import { getPagination, listResponse } from '@/lib/admin-api'

/**
 * GET /api/admin/orders
 * List orders with pagination, search, status & paymentStatus filters.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { page, limit, skip, search } = getPagination(request.url)
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || undefined
    const paymentStatus = url.searchParams.get('paymentStatus') || undefined

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

    return listResponse(orders, total, page, limit)
  } catch (err: any) {
    console.error('admin/orders GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/orders
 * Create a new order (with items + initial OrderHistory entry) in a transaction.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

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
          userId: auth.user!.id,
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
  } catch (err: any) {
    console.error('admin/orders POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
