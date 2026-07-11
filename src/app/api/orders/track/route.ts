import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'

/**
 * GET /api/orders/track?orderNumber=<NUM>&phone=<PHONE>
 * Public order tracking by order number + phone (no auth required).
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const orderNumber = (url.searchParams.get('orderNumber') || '').trim()
    const phone = (url.searchParams.get('phone') || '').trim()

    if (!orderNumber || !phone) {
      return errorResponse('orderNumber and phone are required', 400)
    }

    const order = await db.order.findFirst({
      where: {
        orderNumber,
        customerPhone: phone,
      },
      include: {
        items: true,
      },
    })

    if (!order) {return errorResponse('Order not found', 404)}

    const histories = await db.orderHistory.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: 'asc' },
    })

    return jsonResponse({
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
  } catch (err: any) {
    console.error('public/orders/track GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
