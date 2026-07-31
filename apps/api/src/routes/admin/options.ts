// Admin product-option routes: list, create, update, delete.
// Backs the admin "Options" page (apps/web/src/app/admin/options).
//
// Note: products store their options as a JSON string field
// (Product.productOptions), so options are a standalone dictionary.
//
// Mounted at /api/admin/options

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'

const router = Router()

const OPTION_TYPES = ['SELECT', 'RADIO', 'CHECKBOX', 'TEXT'] as const

const optionSchema = z
  .object({
    name: z.string().min(1),
    type: z.enum(OPTION_TYPES).optional(),
    required: z.boolean().optional(),
    choices: z.array(z.string()).optional(),
  })
  .passthrough()

// ─── GET /api/admin/options ──────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const options = await db.option.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
    })
    res.json({ data: options })
  })
)

// ─── POST /api/admin/options ─────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, optionSchema)

    const option = await db.option.create({
      data: {
        name: body.name,
        type: body.type || 'SELECT',
        required: !!body.required,
        choices: body.choices ?? [],
      },
    })
    res.status(201).json({ data: option })
  })
)

// ─── GET /api/admin/options/:id ──────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const option = await db.option.findUnique({ where: { id } })
    if (!option || option.isDeleted) {
      throw new ApiError('Option not found', 404)
    }
    res.json({ data: option })
  })
)

// ─── PUT /api/admin/options/:id ──────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, optionSchema.partial())

    const existing = await db.option.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Option not found', 404)
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.type !== undefined) data.type = body.type
    if (body.required !== undefined) data.required = !!body.required
    if (body.choices !== undefined) data.choices = body.choices

    const option = await db.option.update({ where: { id }, data })
    res.json({ data: option })
  })
)

// ─── DELETE /api/admin/options/:id ───────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.option.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Option not found', 404)
    }

    await db.option.update({ where: { id }, data: { isDeleted: true } })
    res.json({ message: 'Option deleted' })
  })
)

export default router

