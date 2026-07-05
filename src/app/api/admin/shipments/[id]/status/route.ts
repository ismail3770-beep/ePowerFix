import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/auth'

/**
 * PUT /api/admin/shipments/[id]/status
 * Update only the status of a shipment (and optionally record shipped/delivered timestamps).
 * Body: { status, shippedAt?, deliveredAt? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const body = await parseBody<any>(request)
    if (!body?.status) return errorResponse('status is required', 400)

    const existing = await db.shipment.findUnique({ where: { id } })
    if (!existing) return errorResponse('Shipment not found', 404)

    const data: any = { status: body.status }
    if (body.status === 'SHIPPED' && !existing.shippedAt) {
      data.shippedAt = new Date()
    }
    if (body.status === 'DELIVERED') {
      data.deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : new Date()
    }

    const shipment = await db.shipment.update({
      where: { id },
      data,
      include: { order: true },
    })

    return jsonResponse({ data: shipment, message: 'Shipment status updated' })
  } catch (err: any) {
    console.error('admin/shipments/[id]/status PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
