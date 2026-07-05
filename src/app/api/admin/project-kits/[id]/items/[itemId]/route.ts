import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/admin-api'

/**
 * PUT /api/admin/project-kits/[kitId]/items/[itemId]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id: kitId, itemId } = await params
    const body = await request.json()

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
  } catch (err: any) {
    console.error('admin/project-kits items PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/project-kits/[kitId]/items/[itemId]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id: kitId, itemId } = await params
    const existing = await db.projectKitItem.findFirst({
      where: { id: itemId, kitId },
    })
    if (!existing) return errorResponse('Kit item not found', 404)

    await db.projectKitItem.delete({ where: { id: itemId } })
    return jsonResponse({ message: 'Item removed from kit' })
  } catch (err: any) {
    console.error('admin/project-kits items DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
