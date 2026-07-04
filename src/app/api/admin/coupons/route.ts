import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
  getPagination,
  listResponse,
} from '@/lib/admin-api'

/**
 * Maps a Coupon DB row to the response shape expected by the admin frontend.
 * The frontend uses `discount`/`discountType`/`maxUses`/`validFrom`/`validTo`
 * while the schema stores `value`/`type`/`usageLimit`/`startDate`/`endDate`.
 * We expose BOTH sets of names so the API stays compatible with the task spec
 * and the existing admin UI.
 */
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
 * GET /api/admin/coupons
 * List coupons with pagination + search. Returns listResponse.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { page, limit, skip, search } = getPagination(request.url)

    const where: any = {}
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [coupons, total] = await Promise.all([
      db.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.coupon.count({ where }),
    ])

    return listResponse(coupons.map(mapCoupon), total, page, limit)
  } catch (err: any) {
    console.error('admin/coupons GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/coupons
 * Create a coupon. Accepts both task-spec field names (type/value/usageLimit/
 * startsAt/expiresAt/maxDiscount) and frontend field names (discountType/
 * discount/maxUses/validFrom/validTo). The `code` is upper-cased.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const code = (body.code || '').toString().trim().toUpperCase()
    if (!code) return errorResponse('code is required', 400)

    // type / discountType
    const type = body.type || body.discountType || 'PERCENTAGE'
    // value / discount
    const value =
      body.value !== undefined && body.value !== null
        ? Number(body.value)
        : body.discount !== undefined && body.discount !== null
        ? Number(body.discount)
        : null
    if (value === null || Number.isNaN(value)) {
      return errorResponse('value (or discount) is required', 400)
    }

    // Date range. Schema requires both startDate and endDate.
    const now = new Date()
    const startDate = body.startsAt || body.validFrom
      ? new Date(body.startsAt || body.validFrom)
      : now
    const endDate = body.expiresAt || body.validTo
      ? new Date(body.expiresAt || body.validTo)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (endDate < startDate) {
      return errorResponse('expiresAt must be after startsAt', 400)
    }

    // Uniqueness check for the code.
    const existing = await db.coupon.findUnique({ where: { code } })
    if (existing) return errorResponse('Coupon code already exists', 400)

    const coupon = await db.coupon.create({
      data: {
        code,
        name: body.name || code,
        nameBn: body.nameBn || null,
        description: body.description || null,
        type,
        value,
        minOrder:
          body.minOrder !== undefined && body.minOrder !== null
            ? Number(body.minOrder)
            : null,
        maxDiscount:
          body.maxDiscount !== undefined && body.maxDiscount !== null
            ? Number(body.maxDiscount)
            : null,
        usageLimit:
          body.usageLimit !== undefined && body.usageLimit !== null
            ? Number(body.usageLimit)
            : body.maxUses !== undefined && body.maxUses !== null
            ? Number(body.maxUses)
            : null,
        startDate,
        endDate,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return jsonResponse({ data: mapCoupon(coupon) }, 201)
  } catch (err: any) {
    console.error('admin/coupons POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
