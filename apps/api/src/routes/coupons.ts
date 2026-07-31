// Coupon routes: validate
// Migrated from apps/web/src/app/api/coupons/validate/route.ts (Next.js → Express).

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError } from '../lib/api-handler.js'
import { calculateCouponDiscount, formatPaisa, toPaisa } from '../lib/money.js'

const router = Router()

const validateCouponQuery = z.object({
  code: z.string().trim().min(1, 'Coupon code is required').max(100),
  orderTotal: z.string().trim().min(1, 'orderTotal is required'),
}).strict()

// ─── GET /api/coupons/validate ────────────────────────────────────────────────
router.get(
  '/validate',
  asyncHandler(async (req, res) => {
    const parsed = validateCouponQuery.safeParse(req.query)
    if (!parsed.success) {
      throw new ApiError('Invalid coupon validation request', 400)
    }

    let subtotalPaisa: number
    try {
      subtotalPaisa = toPaisa(parsed.data.orderTotal)
    } catch (error) {
      throw new ApiError(error instanceof Error ? error.message : 'Invalid orderTotal', 400)
    }

    const code = parsed.data.code.toUpperCase()
    const coupon = await db.coupon.findFirst({
      where: { code, isActive: true, isDeleted: false },
    })
    if (!coupon) throw new ApiError('Invalid coupon code', 404)

    const now = new Date()
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new ApiError('Coupon has expired', 400)
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError('Coupon usage limit reached', 400)
    }

    const minimumPaisa = coupon.minOrder === null ? null : toPaisa(coupon.minOrder)
    if (minimumPaisa !== null && subtotalPaisa < minimumPaisa) {
      throw new ApiError(`Minimum order amount ৳${formatPaisa(minimumPaisa)} required for this coupon`, 400)
    }

    const discountPaisa = calculateCouponDiscount({
      subtotalPaisa,
      type: coupon.type,
      value: coupon.value,
      maxDiscount: coupon.maxDiscount,
    })

    res.json({
      data: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discount: Number(formatPaisa(discountPaisa)),
      },
    })
  })
)

export default router
