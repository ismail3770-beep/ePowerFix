import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

const updateItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  isRequired: z.boolean().optional(),
  notes: z.string().max(500).optional(),
}).passthrough()

// ─── PUT ──────────────────────────────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id: kitId, itemId } = await params
  const body = await validateBody(request, updateItemSchema)

  const existing = await db.projectKitItem.findFirst({
    where: { id: itemId, kitId },
  })
  if (!existing) return errorResponse('Kit item not found', 404)

  const data: any = {}
  if (body.quantity !== undefined) data.quantity = Math.max(1, Number(body.quantity) || 1)
  if (body.isRequired !== undefined) data.isRequired = !!body.isRequired
  if (body.notes !== undefined) data.notes = body.notes || null

  const updated = await db.projectKitItem.update({
    where: { id: itemId },
    data,
    include: { product: { select: { id: true, name: true, price: true, salePrice: true, stock: true, images: true, sku: true } } },
  })

  return jsonResponse({ data: updated, message: 'Kit item updated' })
})

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id: kitId, itemId } = await params
  const existing = await db.projectKitItem.findFirst({
    where: { id: itemId, kitId },
  })
  if (!existing) return errorResponse('Kit item not found', 404)

  await db.projectKitItem.delete({ where: { id: itemId } })
  return jsonResponse({ message: 'Item removed from kit' })
})
