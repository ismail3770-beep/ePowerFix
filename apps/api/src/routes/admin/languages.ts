// Admin language routes: list, create, update, delete.
// Backs the admin "Languages" page (apps/web/src/app/admin/languages).
//
// Mounted at /api/admin/languages

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'

const router = Router()

const languageSchema = z
  .object({
    name: z.string().min(1),
    code: z.string().min(1),
    nativeName: z.string().optional(),
    direction: z.enum(['ltr', 'rtl']).optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

// ─── GET /api/admin/languages ────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const languages = await db.language.findMany({
      where: { isDeleted: false },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })
    res.json({ data: languages })
  })
)

// ─── POST /api/admin/languages ───────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, languageSchema)
    const code = body.code.toLowerCase().trim()

    const existing = await db.language.findUnique({ where: { code } })
    if (existing && !existing.isDeleted) {
      throw new ApiError('A language with this code already exists', 400)
    }

    // Only one default language at a time.
    if (body.isDefault) {
      await db.language.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const language = await db.language.create({
      data: {
        name: body.name,
        code,
        nativeName: body.nativeName || body.name,
        direction: body.direction === 'rtl' ? 'rtl' : 'ltr',
        isDefault: !!body.isDefault,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    res.status(201).json({ data: language })
  })
)

// ─── PUT /api/admin/languages/:id ────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, languageSchema.partial())

    const existing = await db.language.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Language not found', 404)
    }

    if (body.code !== undefined) {
      const code = body.code.toLowerCase().trim()
      const owner = await db.language.findUnique({ where: { code } })
      if (owner && owner.id !== id) {
        throw new ApiError('A language with this code already exists', 400)
      }
    }

    if (body.isDefault) {
      await db.language.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.code !== undefined) data.code = body.code.toLowerCase().trim()
    if (body.nativeName !== undefined) data.nativeName = body.nativeName
    if (body.direction !== undefined) data.direction = body.direction === 'rtl' ? 'rtl' : 'ltr'
    if (body.isDefault !== undefined) data.isDefault = !!body.isDefault
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    const language = await db.language.update({ where: { id }, data })
    res.json({ data: language })
  })
)

// ─── DELETE /api/admin/languages/:id ─────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.language.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Language not found', 404)
    }
    if (existing.isDefault) {
      throw new ApiError('Cannot delete the default language', 400)
    }

    await db.language.update({ where: { id }, data: { isDeleted: true, isActive: false } })
    res.json({ message: 'Language removed' })
  })
)

export default router

