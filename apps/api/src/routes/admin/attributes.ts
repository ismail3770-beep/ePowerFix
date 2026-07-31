// Admin attribute routes: list, create, update, delete.
// Backs the admin "Attributes" page (apps/web/src/app/admin/attributes).
//
// Note: products store their attributes as a JSON string field
// (Product.productAttributes), so attributes are a standalone dictionary.
//
// Mounted at /api/admin/attributes

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

const attributeSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().optional(),
    values: z.array(z.string()).optional(),
  })
  .passthrough()

// ─── GET /api/admin/attributes ───────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const attributes = await db.attribute.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
    })
    res.json({ data: attributes })
  })
)

// ─── POST /api/admin/attributes ──────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, attributeSchema)

    const slug = slugify(body.slug || body.name)
    const existing = await db.attribute.findUnique({ where: { slug } })
    if (existing && !existing.isDeleted) {
      throw new ApiError('An attribute with this slug already exists', 400)
    }

    const attribute = await db.attribute.create({
      data: { name: body.name, slug, values: body.values ?? [] },
    })
    res.status(201).json({ data: attribute })
  })
)

// ─── GET /api/admin/attributes/:id ───────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const attribute = await db.attribute.findUnique({ where: { id } })
    if (!attribute || attribute.isDeleted) {
      throw new ApiError('Attribute not found', 404)
    }
    res.json({ data: attribute })
  })
)

// ─── PUT /api/admin/attributes/:id ───────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, attributeSchema.partial())

    const existing = await db.attribute.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Attribute not found', 404)
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.slug !== undefined || body.name !== undefined) {
      const slug = slugify(body.slug || (body.name as string))
      const owner = await db.attribute.findUnique({ where: { slug } })
      if (owner && owner.id !== id) {
        throw new ApiError('An attribute with this slug already exists', 400)
      }
      data.slug = slug
    }
    if (body.values !== undefined) data.values = body.values

    const attribute = await db.attribute.update({ where: { id }, data })
    res.json({ data: attribute })
  })
)

// ─── DELETE /api/admin/attributes/:id ────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.attribute.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Attribute not found', 404)
    }

    await db.attribute.update({ where: { id }, data: { isDeleted: true } })
    res.json({ message: 'Attribute deleted' })
  })
)

export default router

