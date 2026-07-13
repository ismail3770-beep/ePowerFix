import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/auth'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateShipmentStatusSchema = z.object({
  status: z.string().min(1),
  shippedAt: z.string().optional(),
  deliveredAt: z.string().optional(),
}).passthrough()

// ─── PUT /api/admin/shipments/[id]/status ─────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updateShipmentStatusSchema)

  if (!body?.status) {return errorResponse('status is required', 400)}

  const existing = await db.shipment.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Shipment not found', 404)}

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
})
