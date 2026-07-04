import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

function mapFlashSale(f: any) {
  if (!f) return f
  return {
    ...f,
    discountPercent: f.discount,
    startsAt: f.startDate,
    expiresAt: f.endDate,
  }
}

/**
 * GET /api/admin/flash-sales/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const flashSale = await db.flashSale.findUnique({
      where: { id },
      include: { products: { select: { id: true, name: true, slug: true } } },
    })
    if (!flashSale) return errorResponse('Flash sale not found', 404)
    return jsonResponse({ data: mapFlashSale(flashSale) })
  } catch (err: any) {
    console.error('admin/flash-sales/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/flash-sales/[id]
 * Partial update including the `isActive` toggle the frontend uses.
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
    if (!body) return errorResponse('Invalid request body', 400)

    const existing = await db.flashSale.findUnique({ where: { id } })
    if (!existing) return errorResponse('Flash sale not found', 404)

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.description !== undefined) data.description = body.description || null
    if (body.startDate !== undefined || body.startsAt !== undefined) {
      const s = body.startDate !== undefined ? body.startDate : body.startsAt
      data.startDate = s ? new Date(s) : existing.startDate
    }
    if (body.endDate !== undefined || body.expiresAt !== undefined) {
      const e = body.endDate !== undefined ? body.endDate : body.expiresAt
      data.endDate = e ? new Date(e) : existing.endDate
    }
    if (body.discount !== undefined || body.discountPercent !== undefined) {
      const d = body.discount !== undefined ? body.discount : body.discountPercent
      data.discount = Number(d)
    }
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    // Validate date range if both are present.
    const startDate = data.startDate || existing.startDate
    const endDate = data.endDate || existing.endDate
    if (endDate < startDate) {
      return errorResponse('endDate must be after startDate', 400)
    }

    const flashSale = await db.flashSale.update({ where: { id }, data })
    return jsonResponse({ data: mapFlashSale(flashSale) })
  } catch (err: any) {
    console.error('admin/flash-sales/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/flash-sales/[id] — soft-delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.flashSale.findUnique({ where: { id } })
    if (!existing) return errorResponse('Flash sale not found', 404)

    await db.flashSale.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    return jsonResponse({ message: 'Flash sale deleted' })
  } catch (err: any) {
    console.error('admin/flash-sales/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
