import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  jsonResponse,
  errorResponse,
} from '@/lib/auth'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createShipmentSchema = z.object({
  orderId: z.string().min(1),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  status: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  shippedAt: z.string().optional(),
  notes: z.string().optional(),
}).passthrough()

// ─── GET /api/admin/shipments ─────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
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
})

// ─── POST /api/admin/shipments ────────────────────────────────────────────────

export const POST = adminRoute(createShipmentSchema, async (request, body, user) => {
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
})
