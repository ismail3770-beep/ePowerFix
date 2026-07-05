import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/auth'

/**
 * GET  /api/admin/shipments/[id]
 * PUT  /api/admin/shipments/[id]   — update shipment fields
 * DELETE /api/admin/shipments/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const shipment = await db.shipment.findUnique({
      where: { id },
      include: { order: true },
    })
    if (!shipment) return errorResponse('Shipment not found', 404)
    return jsonResponse({ data: shipment })
  } catch (err: any) {
    console.error('admin/shipments/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const existing = await db.shipment.findUnique({ where: { id } })
    if (!existing) return errorResponse('Shipment not found', 404)

    const data: any = {}
    if (body.trackingNumber !== undefined) data.trackingNumber = body.trackingNumber || null
    if (body.carrier !== undefined) data.carrier = body.carrier || null
    if (body.status !== undefined) data.status = body.status
    if (body.estimatedDelivery !== undefined) {
      data.estimatedDelivery = body.estimatedDelivery ? new Date(body.estimatedDelivery) : null
    }
    if (body.shippedAt !== undefined) {
      data.shippedAt = body.shippedAt ? new Date(body.shippedAt) : null
    }
    if (body.notes !== undefined) data.notes = body.notes || null

    const shipment = await db.shipment.update({
      where: { id },
      data,
      include: { order: true },
    })

    return jsonResponse({ data: shipment, message: 'Shipment updated' })
  } catch (err: any) {
    console.error('admin/shipments/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    await db.shipment.delete({ where: { id } })
    return jsonResponse({ message: 'Shipment deleted' })
  } catch (err: any) {
    console.error('admin/shipments/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
