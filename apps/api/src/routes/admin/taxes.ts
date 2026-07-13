// Admin tax routes: list, create, get, update, delete.
// Migrated from apps/web/src/app/api/admin/taxes/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/taxes

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  getPagination,
  listResponse,
} from '../../lib/helpers.js'

const router = Router()

function mapTax(t: any) {
  if (!t) return t
  return { ...t, value: t.rate }
}

const createTaxSchema = z
  .object({
    name: z.string().min(1),
    type: z.string().optional(),
    rate: z.number().nullable().optional(),
    value: z.number().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

const updateTaxSchema = z
  .object({
    name: z.string().optional(),
    type: z.string().optional(),
    rate: z.number().nullable().optional(),
    value: z.number().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

// ─── GET /api/admin/taxes ────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)

    const where: any = {}
    if (search) {
      where.OR = [{ name: { contains: search } }]
    }

    const [taxes, total] = await Promise.all([
      db.tax.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.tax.count({ where }),
    ])

    res.json(listResponse(taxes.map(mapTax), total, page, limit))
  })
)

// ─── POST /api/admin/taxes ───────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createTaxSchema)

    const name = (body.name || '').toString().trim()
    if (!name) {
      throw new ApiError('name is required', 400)
    }

    const type = (body.type || 'PERCENTAGE').toString().toUpperCase()
    if (!['PERCENTAGE', 'FLAT'].includes(type)) {
      throw new ApiError('type must be PERCENTAGE or FLAT', 400)
    }

    const rate =
      body.rate !== undefined && body.rate !== null
        ? Number(body.rate)
        : body.value !== undefined && body.value !== null
        ? Number(body.value)
        : null
    if (rate === null || Number.isNaN(rate)) {
      throw new ApiError('value (or rate) is required', 400)
    }

    const tax = await db.tax.create({
      data: {
        name,
        type,
        rate,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    res.status(201).json({ data: mapTax(tax) })
  })
)

// ─── GET /api/admin/taxes/:id ────────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const tax = await db.tax.findUnique({ where: { id } })
    if (!tax) {
      throw new ApiError('Tax not found', 404)
    }
    res.json({ data: mapTax(tax) })
  })
)

// ─── PUT /api/admin/taxes/:id ────────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateTaxSchema)

    const existing = await db.tax.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Tax not found', 404)
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.type !== undefined) {
      const type = (body.type || '').toString().toUpperCase()
      if (!['PERCENTAGE', 'FLAT'].includes(type)) {
        throw new ApiError('type must be PERCENTAGE or FLAT', 400)
      }
      data.type = type
    }
    if (body.rate !== undefined || body.value !== undefined) {
      const v = body.rate !== undefined ? body.rate : body.value
      data.rate = Number(v)
    }
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    const tax = await db.tax.update({ where: { id }, data })
    res.json({ data: mapTax(tax) })
  })
)

// ─── DELETE /api/admin/taxes/:id ─────────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.tax.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Tax not found', 404)
    }

    await db.tax.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    res.json({ message: 'Tax deleted' })
  })
)

export default router
