// Admin variation routes: list, create, update, delete.
// Backs the admin "Variations" page (apps/web/src/app/admin/variations).
//
// Mounted at /api/admin/variations

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'

const router = Router()

const variationSchema = z
  .object({
    name: z.string().min(1),
    type: z.string().optional(), // COLOR | TEXT
    values: z.array(z.string()).optional(),
  })
  .passthrough()

// ─── GET /api/admin/variations ───────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const variations = await db.variation.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
    })
    res.json({ data: variations })
  })
)

// ─── POST /api/admin/variations ──────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, variationSchema)

    const variation = await db.variation.create({
      data: {
        name: body.name,
        type: (body.type || 'TEXT').toUpperCase(),
        values: body.values ?? [],
      },
    })
    res.status(201).json({ data: variation })
  })
)

// ─── GET /api/admin/variations/:id ───────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const variation = await db.variation.findUnique({ where: { id } })
    if (!variation || variation.isDeleted) {
      throw new ApiError('Variation not found', 404)
    }
    res.json({ data: variation })
  })
)

// ─── PUT /api/admin/variations/:id ───────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, variationSchema.partial())

    const existing = await db.variation.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Variation not found', 404)
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.type !== undefined) data.type = body.type.toUpperCase()
    if (body.values !== undefined) data.values = body.values

    const variation = await db.variation.update({ where: { id }, data })
    res.json({ data: variation })
  })
)

// ─── DELETE /api/admin/variations/:id ────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.variation.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Variation not found', 404)
    }

    await db.variation.update({ where: { id }, data: { isDeleted: true } })
    res.json({ message: 'Variation deleted' })
  })
)

export default router

