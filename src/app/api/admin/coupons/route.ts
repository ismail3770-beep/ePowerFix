import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  getPagination,
  listResponse,
} from '@/lib/admin-api'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'

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

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createCouponSchema = z.object({
  code: z.string().min(1),
  name: z.string().optional(),
  nameBn: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  discountType: z.string().optional(),
  value: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  minOrder: z.number().nullable().optional(),
  maxDiscount: z.number().nullable().optional(),
  usageLimit: z.number().nullable().optional(),
  maxUses: z.number().nullable().optional(),
  startsAt: z.string().optional(),
  validFrom: z.string().optional(),
  expiresAt: z.string().optional(),
  validTo: z.string().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/coupons ───────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
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
})

// ─── POST /api/admin/coupons ──────────────────────────────────────────────────

export const POST = adminRoute(createCouponSchema, async (request, body, user) => {
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
  const startRaw = body.startsAt || body.validFrom
  const startDate = startRaw ? new Date(startRaw) : now
  const endRaw = body.expiresAt || body.validTo
  const endDate = endRaw
    ? new Date(endRaw)
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
})
