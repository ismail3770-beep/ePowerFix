import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/auth'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateShipmentSchema = z.object({
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  status: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  shippedAt: z.string().optional(),
  notes: z.string().optional(),
}).passthrough()

// ─── GET /api/admin/shipments/[id] ────────────────────────────────────────────

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const shipment = await db.shipment.findUnique({
    where: { id },
    include: { order: true },
  })
  if (!shipment) {return errorResponse('Shipment not found', 404)}
  return jsonResponse({ data: shipment })
})

// ─── PUT /api/admin/shipments/[id] ────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updateShipmentSchema)

  const existing = await db.shipment.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Shipment not found', 404)}

  const data: any = {}
  if (body.trackingNumber !== undefined) {data.trackingNumber = body.trackingNumber || null}
  if (body.carrier !== undefined) {data.carrier = body.carrier || null}
  if (body.status !== undefined) {data.status = body.status}
  if (body.estimatedDelivery !== undefined) {
    data.estimatedDelivery = body.estimatedDelivery ? new Date(body.estimatedDelivery) : null
  }
  if (body.shippedAt !== undefined) {
    data.shippedAt = body.shippedAt ? new Date(body.shippedAt) : null
  }
  if (body.notes !== undefined) {data.notes = body.notes || null}

  const shipment = await db.shipment.update({
    where: { id },
    data,
    include: { order: true },
  })

  return jsonResponse({ data: shipment, message: 'Shipment updated' })
})

// ─── DELETE /api/admin/shipments/[id] ─────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  await db.shipment.delete({ where: { id } })
  return jsonResponse({ message: 'Shipment deleted' })
})
