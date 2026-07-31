// Admin attribute-set routes: list, create, update, delete.
// Backs the admin "Attribute Sets" page (apps/web/src/app/admin/attribute-sets).
//
// An AttributeSet groups multiple Attribute IDs together so they can be
// assigned to a product in bulk (e.g. "Electrical" set = wattage + voltage + phase).
//
// Mounted at /api/admin/attribute-sets

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'

const router = Router()

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const attributeSetSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().optional(),
    description: z.string().optional(),
    attributeIds: z.array(z.string()).optional(),
  })
  .passthrough()

// ─── GET /api/admin/attribute-sets ───────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const attributeSets = await db.attributeSet.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
    })
    res.json({ data: attributeSets })
  })
)

// ─── POST /api/admin/attribute-sets ──────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, attributeSetSchema)

    const slug = slugify(body.slug || body.name)
    const existing = await db.attributeSet.findUnique({ where: { slug } })
    if (existing && !existing.isDeleted) {
      throw new ApiError('An attribute set with this slug already exists', 400)
    }

    const attributeSet = await db.attributeSet.create({
      data: {
        name: body.name,
        slug,
        description: body.description ?? null,
        attributeIds: body.attributeIds ?? [],
      },
    })
    res.status(201).json({ data: attributeSet })
  })
)

// ─── GET /api/admin/attribute-sets/:id ───────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const attributeSet = await db.attributeSet.findUnique({ where: { id } })
    if (!attributeSet || attributeSet.isDeleted) {
      throw new ApiError('Attribute set not found', 404)
    }
    res.json({ data: attributeSet })
  })
)

// ─── PUT /api/admin/attribute-sets/:id ───────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, attributeSetSchema.partial())

    const existing = await db.attributeSet.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Attribute set not found', 404)
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.slug !== undefined || body.name !== undefined) {
      const slug = slugify(body.slug || (body.name as string))
      const owner = await db.attributeSet.findUnique({ where: { slug } })
      if (owner && owner.id !== id) {
        throw new ApiError('An attribute set with this slug already exists', 400)
      }
      data.slug = slug
    }
    if (body.description !== undefined) data.description = body.description
    if (body.attributeIds !== undefined) data.attributeIds = body.attributeIds

    const attributeSet = await db.attributeSet.update({ where: { id }, data })
    res.json({ data: attributeSet })
  })
)

// ─── DELETE /api/admin/attribute-sets/:id ────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.attributeSet.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Attribute set not found', 404)
    }

    await db.attributeSet.update({ where: { id }, data: { isDeleted: true } })
    res.json({ message: 'Attribute set deleted' })
  })
)

export default router
