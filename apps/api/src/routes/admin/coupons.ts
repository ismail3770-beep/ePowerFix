// Admin coupon routes: list, create, get, update, delete.
// Migrated from apps/web/src/app/api/admin/coupons/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/coupons

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  getPagination,
  listResponse,
} from '../../lib/helpers.js'

const router = Router()

/**
 * Maps a Coupon DB row to the response shape expected by the admin frontend.
 * Exposes both schema field names and convenience aliases.
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

const createCouponSchema = z
  .object({
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
  })
  .passthrough()

const updateCouponSchema = z
  .object({
    code: z.string().optional(),
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
  })
  .passthrough()

// ─── GET /api/admin/coupons ──────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)

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

    res.json(listResponse(coupons.map(mapCoupon), total, page, limit))
  })
)

// ─── POST /api/admin/coupons ─────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createCouponSchema)

    const code = (body.code || '').toString().trim().toUpperCase()
    if (!code) {
      throw new ApiError('code is required', 400)
    }

    const type = body.type || body.discountType || 'PERCENTAGE'
    const value =
      body.value !== undefined && body.value !== null
        ? Number(body.value)
        : body.discount !== undefined && body.discount !== null
        ? Number(body.discount)
        : null
    if (value === null || Number.isNaN(value)) {
      throw new ApiError('value (or discount) is required', 400)
    }

    const now = new Date()
    const startRaw = body.startsAt || body.validFrom
    const startDate = startRaw ? new Date(startRaw) : now
    const endRaw = body.expiresAt || body.validTo
    const endDate = endRaw
      ? new Date(endRaw)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    if (endDate < startDate) {
      throw new ApiError('expiresAt must be after startsAt', 400)
    }

    const existing = await db.coupon.findUnique({ where: { code } })
    if (existing) {
      throw new ApiError('Coupon code already exists', 400)
    }

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

    res.status(201).json({ data: mapCoupon(coupon) })
  })
)

// ─── GET /api/admin/coupons/:id ──────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const coupon = await db.coupon.findUnique({ where: { id } })
    if (!coupon) {
      throw new ApiError('Coupon not found', 404)
    }
    res.json({ data: mapCoupon(coupon) })
  })
)

// ─── PUT /api/admin/coupons/:id ──────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateCouponSchema)

    const existing = await db.coupon.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Coupon not found', 404)
    }

    const data: any = {}

    if (body.code !== undefined) {
      const code = (body.code || '').toString().trim().toUpperCase()
      if (!code) {
        throw new ApiError('code cannot be empty', 400)
      }
      if (code !== existing.code) {
        const owner = await db.coupon.findUnique({ where: { code } })
        if (owner && owner.id !== id) {
          throw new ApiError('Coupon code already exists', 400)
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
      data.minOrder = body.minOrder === null ? null : Number(body.minOrder)
    }
    if (body.maxDiscount !== undefined) {
      data.maxDiscount = body.maxDiscount === null ? null : Number(body.maxDiscount)
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

    const startDate = data.startDate || existing.startDate
    const endDate = data.endDate || existing.endDate
    if (endDate < startDate) {
      throw new ApiError('expiresAt must be after startsAt', 400)
    }

    const coupon = await db.coupon.update({ where: { id }, data })
    res.json({ data: mapCoupon(coupon) })
  })
)

// ─── DELETE /api/admin/coupons/:id ───────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.coupon.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Coupon not found', 404)
    }

    await db.coupon.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    res.json({ message: 'Coupon deleted' })
  })
)

export default router
