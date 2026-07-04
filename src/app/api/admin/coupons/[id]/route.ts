import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

function mapCoupon(c: any) {
  if (!c) return c
  return {
    ...c,
    discount: c.value,
    discountType: c.type,
    maxUses: c.usageLimit,
    validFrom: c.startDate,
    validTo: c.endDate,
    startsAt: c.startDate,
    expiresAt: c.endDate,
  }
}

/**
 * GET /api/admin/coupons/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const coupon = await db.coupon.findUnique({ where: { id } })
    if (!coupon) return errorResponse('Coupon not found', 404)
    return jsonResponse({ data: mapCoupon(coupon) })
  } catch (err: any) {
    console.error('admin/coupons/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/coupons/[id]
 * Accepts both task-spec and frontend field names.
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

    const existing = await db.coupon.findUnique({ where: { id } })
    if (!existing) return errorResponse('Coupon not found', 404)

    const data: any = {}

    if (body.code !== undefined) {
      const code = (body.code || '').toString().trim().toUpperCase()
      if (!code) return errorResponse('code cannot be empty', 400)
      if (code !== existing.code) {
        const owner = await db.coupon.findUnique({ where: { code } })
        if (owner && owner.id !== id) {
          return errorResponse('Coupon code already exists', 400)
        }
      }
      data.code = code
    }
    if (body.name !== undefined) data.name = body.name
    if (body.nameBn !== undefined) data.nameBn = body.nameBn || null
    if (body.description !== undefined) data.description = body.description || null
    if (body.type !== undefined || body.discountType !== undefined) {
      data.type = body.type || body.discountType
    }
    if (body.value !== undefined || body.discount !== undefined) {
      const v = body.value !== undefined ? body.value : body.discount
      data.value = Number(v)
    }
    if (body.minOrder !== undefined) {
      data.minOrder =
        body.minOrder === null ? null : Number(body.minOrder)
    }
    if (body.maxDiscount !== undefined) {
      data.maxDiscount =
        body.maxDiscount === null ? null : Number(body.maxDiscount)
    }
    if (body.usageLimit !== undefined || body.maxUses !== undefined) {
      const u = body.usageLimit !== undefined ? body.usageLimit : body.maxUses
      data.usageLimit = u === null ? null : Number(u)
    }
    if (body.startsAt !== undefined || body.validFrom !== undefined) {
      const s = body.startsAt !== undefined ? body.startsAt : body.validFrom
      data.startDate = s ? new Date(s) : existing.startDate
    }
    if (body.expiresAt !== undefined || body.validTo !== undefined) {
      const e = body.expiresAt !== undefined ? body.expiresAt : body.validTo
      data.endDate = e ? new Date(e) : existing.endDate
    }
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    // Validate date range if both are present.
    const startDate = data.startDate || existing.startDate
    const endDate = data.endDate || existing.endDate
    if (endDate < startDate) {
      return errorResponse('expiresAt must be after startsAt', 400)
    }

    const coupon = await db.coupon.update({ where: { id }, data })
    return jsonResponse({ data: mapCoupon(coupon) })
  } catch (err: any) {
    console.error('admin/coupons/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/coupons/[id] — soft-delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.coupon.findUnique({ where: { id } })
    if (!existing) return errorResponse('Coupon not found', 404)

    await db.coupon.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    return jsonResponse({ message: 'Coupon deleted' })
  } catch (err: any) {
    console.error('admin/coupons/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
