// Admin flash-sale routes: list, create, get, update, delete.
// Migrated from apps/web/src/app/api/admin/flash-sales/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/flash-sales

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  getPagination,
  listResponse,
} from '../../lib/helpers.js'

const router = Router()

function mapFlashSale(f: any) {
  if (!f) return f
  return {
    ...f,
    discountPercent: f.discount,
    startDate: f.startDate,
    endDate: f.endDate,
    startsAt: f.startDate,
    expiresAt: f.endDate,
  }
}

const createFlashSaleSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    discount: z.number().nullable().optional(),
    discountPercent: z.number().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

const updateFlashSaleSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    startDate: z.string().optional(),
    startsAt: z.string().optional(),
    endDate: z.string().optional(),
    expiresAt: z.string().optional(),
    discount: z.number().nullable().optional(),
    discountPercent: z.number().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

// ─── GET /api/admin/flash-sales ──────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)
    const status = query.status || undefined

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [flashSales, total] = await Promise.all([
      db.flashSale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { products: { select: { id: true, name: true, slug: true } } },
      }),
      db.flashSale.count({ where }),
    ])

    res.json(listResponse(flashSales.map(mapFlashSale), total, page, limit))
  })
)

// ─── POST /api/admin/flash-sales ─────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createFlashSaleSchema)

    const title = (body.title || '').toString().trim()
    if (!title) {
      throw new ApiError('title is required', 400)
    }

    const startDateRaw = body.startDate || body.startsAt
    const endDateRaw = body.endDate || body.expiresAt
    if (!startDateRaw) {
      throw new ApiError('startDate is required', 400)
    }
    if (!endDateRaw) {
      throw new ApiError('endDate is required', 400)
    }

    const startDate = new Date(startDateRaw)
    const endDate = new Date(endDateRaw)
    if (Number.isNaN(startDate.getTime())) {
      throw new ApiError('startDate is invalid', 400)
    }
    if (Number.isNaN(endDate.getTime())) {
      throw new ApiError('endDate is invalid', 400)
    }
    if (endDate < startDate) {
      throw new ApiError('endDate must be after startDate', 400)
    }

    const discount =
      body.discount !== undefined && body.discount !== null
        ? Number(body.discount)
        : body.discountPercent !== undefined && body.discountPercent !== null
        ? Number(body.discountPercent)
        : null
    if (discount === null || Number.isNaN(discount)) {
      throw new ApiError('discount (or discountPercent) is required', 400)
    }

    const flashSale = await db.flashSale.create({
      data: {
        title,
        description: body.description || null,
        startDate,
        endDate,
        discount,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    res.status(201).json({ data: mapFlashSale(flashSale) })
  })
)

// ─── GET /api/admin/flash-sales/:id ──────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const flashSale = await db.flashSale.findUnique({
      where: { id },
      include: { products: { select: { id: true, name: true, slug: true } } },
    })
    if (!flashSale) {
      throw new ApiError('Flash sale not found', 404)
    }
    res.json({ data: mapFlashSale(flashSale) })
  })
)

// ─── PUT /api/admin/flash-sales/:id ──────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateFlashSaleSchema)

    const existing = await db.flashSale.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Flash sale not found', 404)
    }

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

    const startDate = data.startDate || existing.startDate
    const endDate = data.endDate || existing.endDate
    if (endDate < startDate) {
      throw new ApiError('endDate must be after startDate', 400)
    }

    const flashSale = await db.flashSale.update({ where: { id }, data })
    res.json({ data: mapFlashSale(flashSale) })
  })
)

// ─── DELETE /api/admin/flash-sales/:id ───────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.flashSale.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Flash sale not found', 404)
    }

    await db.flashSale.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    res.json({ message: 'Flash sale deleted' })
  })
)

export default router
