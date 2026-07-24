// Coupon routes: validate
// Migrated from apps/web/src/app/api/coupons/validate/route.ts (Next.js → Express).
//
// Note: the source route is GET (the web client calls
//   GET /api/coupons/validate?code=<CODE>&orderTotal=<number>
// in checkout/page.tsx and CheckoutDialog.tsx). We preserve the GET method
// to keep the client contract intact.

import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError } from '../lib/api-handler.js'
import { toNumber } from '../lib/helpers.js'

const router = Router()

// ─── GET /api/coupons/validate ────────────────────────────────────────────────
// Validates a coupon code against the current order total and returns the
// computed discount. Returns 404 if the coupon is invalid/expired/exhausted.

router.get(
  '/validate',
  asyncHandler(async (req, res) => {
    const rawCode = typeof req.query.code === 'string' ? req.query.code : ''
    const code = rawCode.trim().toUpperCase()
    const orderTotal = parseFloat(
      typeof req.query.orderTotal === 'string' ? req.query.orderTotal : '0'
    )

    // Reject NaN orderTotal (e.g. when the client sends ?orderTotal=abc).
    if (isNaN(orderTotal) || orderTotal < 0) {
      throw new ApiError('Invalid orderTotal', 400)
    }

    if (!code) {
      throw new ApiError('Coupon code is required', 400)
    }

    const coupon = await db.coupon.findFirst({
      where: { code, isActive: true },
    })

    if (!coupon) {
      throw new ApiError('Invalid coupon code', 404)
    }

    const now = new Date()
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new ApiError('Coupon has expired', 400)
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError('Coupon usage limit reached', 400)
    }
    if (coupon.minOrder !== null && orderTotal < toNumber(coupon.minOrder)) {
      throw new ApiError(
        `Minimum order amount ৳${toNumber(coupon.minOrder)} required for this coupon`,
        400
      )
    }

    let discount = 0
    if (coupon.type === 'PERCENTAGE') {
      discount = (orderTotal * toNumber(coupon.value)) / 100
      if (coupon.maxDiscount !== null) {
        discount = Math.min(discount, toNumber(coupon.maxDiscount))
      }
    } else {
      // FIXED amount off
      discount = toNumber(coupon.value)
    }
    discount = Math.min(discount, orderTotal)
    discount = Math.round(discount)

    res.json({
      data: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discount,
      },
    })
  })
)

export default router
