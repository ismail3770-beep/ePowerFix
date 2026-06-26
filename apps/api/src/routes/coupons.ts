import { Router } from 'express'
import { db } from '@epowerfix/db'
import { success, error } from '../utils/response'

export const couponsRouter = Router()

// GET /api/coupons — public list (active only)
couponsRouter.get('/', async (_req, res) => {
  try {
    const coupons = await db.coupon.findMany({
      where: { isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
      select: { id: true, code: true, name: true, description: true, type: true, value: true, minOrder: true, maxDiscount: true, endDate: true },
    })
    res.json(success(coupons))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/coupons/validate?code=xxx&orderTotal=xxx
couponsRouter.get('/validate', async (req, res) => {
  try {
    const { code, orderTotal } = req.query as any
    if (!code || !orderTotal) return res.status(400).json(error('code and orderTotal are required'))

    const coupon = await db.coupon.findFirst({
      where: { code: String(code).toUpperCase(), isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
    })
    if (!coupon) return res.status(404).json(error('Invalid or expired coupon'))
    if (coupon.minOrder && Number(orderTotal) < Number(coupon.minOrder)) {
      return res.status(400).json(error(`Minimum order ৳${coupon.minOrder}`))
    }

    let discount = 0
    if (coupon.type === 'PERCENTAGE') {
      discount = Math.min(Number(orderTotal) * Number(coupon.value) / 100, Number(coupon.maxDiscount || Number(orderTotal)))
    } else {
      discount = Number(coupon.value)
    }

    res.json(success({ code: coupon.code, type: coupon.type, discount, message: `You save ৳${Math.round(discount)}!` }))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
