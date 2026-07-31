// Admin currency routes: list, create, update, delete.
// Backs the admin "Currencies" page (apps/web/src/app/admin/currencies).
//
// Mounted at /api/admin/currencies

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'

const router = Router()

const currencySchema = z
  .object({
    name: z.string().min(1),
    code: z.string().min(1),
    symbol: z.string().min(1),
    exchangeRate: z.union([z.number(), z.string()]).optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

function toRate(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : 1
}

// ─── GET /api/admin/currencies ───────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const currencies = await db.currency.findMany({
      where: { isDeleted: false },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })
    res.json({ data: currencies })
  })
)

// ─── POST /api/admin/currencies ──────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, currencySchema)
    const code = body.code.toUpperCase().trim()

    const existing = await db.currency.findUnique({ where: { code } })
    if (existing && !existing.isDeleted) {
      throw new ApiError('A currency with this code already exists', 400)
    }

    if (body.isDefault) {
      await db.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const currency = await db.currency.create({
      data: {
        name: body.name,
        code,
        symbol: body.symbol,
        exchangeRate: toRate(body.exchangeRate),
        isDefault: !!body.isDefault,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    res.status(201).json({ data: currency })
  })
)

// ─── PUT /api/admin/currencies/:id ───────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, currencySchema.partial())

    const existing = await db.currency.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Currency not found', 404)
    }

    if (body.code !== undefined) {
      const code = body.code.toUpperCase().trim()
      const owner = await db.currency.findUnique({ where: { code } })
      if (owner && owner.id !== id) {
        throw new ApiError('A currency with this code already exists', 400)
      }
    }

    if (body.isDefault) {
      await db.currency.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.code !== undefined) data.code = body.code.toUpperCase().trim()
    if (body.symbol !== undefined) data.symbol = body.symbol
    if (body.exchangeRate !== undefined) data.exchangeRate = toRate(body.exchangeRate)
    if (body.isDefault !== undefined) data.isDefault = !!body.isDefault
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    const currency = await db.currency.update({ where: { id }, data })
    res.json({ data: currency })
  })
)

// ─── DELETE /api/admin/currencies/:id ────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.currency.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Currency not found', 404)
    }
    if (existing.isDefault) {
      throw new ApiError('Cannot delete the default currency', 400)
    }

    await db.currency.update({ where: { id }, data: { isDeleted: true, isActive: false } })
    res.json({ message: 'Currency removed' })
  })
)

export default router

