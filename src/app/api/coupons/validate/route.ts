import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'

/**
 * GET /api/coupons/validate?code=<CODE>&orderTotal=<number>
 * Validates a coupon code against the current order total and returns the
 * computed discount. Returns 404 if the coupon is invalid/expired/exhausted.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = (url.searchParams.get('code') || '').trim().toUpperCase()
    const orderTotal = parseFloat(url.searchParams.get('orderTotal') || '0')

    // M22: Reject NaN orderTotal (e.g. when the client sends ?orderTotal=abc).
    if (isNaN(orderTotal) || orderTotal < 0) {
      return errorResponse('Invalid orderTotal', 400)
    }

    if (!code) return errorResponse('Coupon code is required', 400)

    const coupon = await db.coupon.findFirst({
      where: { code, isActive: true },
    })

    if (!coupon) return errorResponse('Invalid coupon code', 404)

    const now = new Date()
    if (now < coupon.startDate || now > coupon.endDate) {
      return errorResponse('Coupon has expired', 400)
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return errorResponse('Coupon usage limit reached', 400)
    }
    if (coupon.minOrder !== null && orderTotal < coupon.minOrder) {
      return errorResponse(
        `Minimum order amount ৳${coupon.minOrder} required for this coupon`,
        400,
      )
    }

    let discount = 0
    if (coupon.type === 'PERCENTAGE') {
      discount = (orderTotal * coupon.value) / 100
      if (coupon.maxDiscount !== null) {
        discount = Math.min(discount, coupon.maxDiscount)
      }
    } else {
      // FIXED amount off
      discount = coupon.value
    }
    discount = Math.min(discount, orderTotal)
    discount = Math.round(discount)

    return jsonResponse({
      data: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discount,
      },
    })
  } catch (err: any) {
    // M20: don't leak internal error details to the client.
    console.error('public/coupons/validate GET error:', err)
    return errorResponse('Internal server error', 500)
  }
}
