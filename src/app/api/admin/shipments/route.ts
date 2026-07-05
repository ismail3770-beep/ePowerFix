import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/auth'

/**
 * GET /api/admin/shipments?orderId=...
 * List shipments (optionally filtered by order).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const url = new URL(request.url)
    const orderId = url.searchParams.get('orderId') || undefined

    const where: any = {}
    if (orderId) where.orderId = orderId

    const shipments = await db.shipment.findMany({
      where,
      include: { order: true },
      orderBy: { createdAt: 'desc' },
    })

    return jsonResponse({ data: shipments })
  } catch (err: any) {
    console.error('admin/shipments GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/shipments
 * Create a shipment for an order.
 * Body: { orderId, trackingNumber?, carrier?, estimatedDelivery?, shippedAt?, notes? }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)
    if (!body.orderId) return errorResponse('orderId is required', 400)

    // An order can only have one shipment.
    const existing = await db.shipment.findUnique({
      where: { orderId: body.orderId },
    })
    if (existing) return errorResponse('Shipment already exists for this order', 409)

    const shipment = await db.shipment.create({
      data: {
        orderId: body.orderId,
        trackingNumber: body.trackingNumber || null,
        carrier: body.carrier || null,
        status: body.status || 'PENDING',
        estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null,
        shippedAt: body.shippedAt ? new Date(body.shippedAt) : null,
        notes: body.notes || null,
      },
      include: { order: true },
    })

    return jsonResponse({ data: shipment, message: 'Shipment created' }, 201)
  } catch (err: any) {
    console.error('admin/shipments POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
