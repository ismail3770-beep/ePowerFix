import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'

export const couponsRouter = Router()

const createCouponSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nameBn: z.string().optional().default(''),
  description: z.string().optional().default(''),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().min(0),
  minOrder: z.number().min(0).optional().nullable(),
  maxDiscount: z.number().min(0).optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isActive: z.boolean().default(true),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) > new Date(data.startDate)
  }
  return true
}, { message: 'End date must be after start date', path: ['endDate'] })

// GET /api/admin/coupons
couponsRouter.get('/', requireAdmin, async (_req, res) => {
  try {
    const coupons = await db.coupon.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } },
    })
    res.json(success(coupons))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/coupons/trashed — soft-deleted coupons
couponsRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const coupons = await db.coupon.findMany({
      where: { isDeleted: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } },
    })
    res.json(success(coupons))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/coupons/:id — single coupon with usage details
couponsRouter.get('/:id', requireAdmin, async (req, res) => {
  try {
    const coupon = await db.coupon.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { usages: true } },
        usages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    })
    if (!coupon) return res.status(404).json(error('Coupon not found'))
    res.json(success(coupon))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// POST /api/admin/coupons
couponsRouter.post('/', requireAdmin, validate(createCouponSchema), async (req, res) => {
  try {
    const coupon = await db.coupon.create({
      data: {
        ...req.body,
        code: req.body.code.toUpperCase(),
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      },
    })
    res.status(201).json(success(coupon, 'Coupon created'))
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json(error('Coupon code already exists'))
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/coupons/:id
couponsRouter.put('/:id', requireAdmin, validate(createCouponSchema.partial()), async (req, res) => {
  try {
    const data: any = { ...req.body }
    if (data.code) data.code = data.code.toUpperCase()
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)

    const coupon = await db.coupon.update({ where: { id: req.params.id }, data })
    res.json(success(coupon, 'Coupon updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/coupons/:id/restore
couponsRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const coupon = await db.coupon.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(coupon, 'Coupon restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/coupons/:id (soft delete)
couponsRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.coupon.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'Coupon moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
