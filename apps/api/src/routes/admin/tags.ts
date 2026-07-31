// Admin tag routes: list, create, update, delete.
// Backs the admin "Tags" page (apps/web/src/app/admin/tags).
//
// Note: products store their tags as a JSON string field (Product.tags), so
// tags are managed here as a standalone dictionary with no FK to products.
//
// Mounted at /api/admin/tags

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

const tagSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().optional(),
  })
  .passthrough()

// ─── GET /api/admin/tags ─────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const tags = await db.tag.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
    })
    res.json({ data: tags })
  })
)

// ─── POST /api/admin/tags ────────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, tagSchema)

    let slug = body.slug ? slugify(body.slug) : slugify(body.name)
    if (!slug) slug = slugify(body.name)

    const existing = await db.tag.findUnique({ where: { slug } })
    if (existing && !existing.isDeleted) {
      throw new ApiError('A tag with this slug already exists', 400)
    }

    const tag = await db.tag.create({ data: { name: body.name, slug } })
    res.status(201).json({ data: tag })
  })
)

// ─── GET /api/admin/tags/:id ──────────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const tag = await db.tag.findUnique({ where: { id } })
    if (!tag || tag.isDeleted) {
      throw new ApiError('Tag not found', 404)
    }
    res.json({ data: tag })
  })
)

// ─── PUT /api/admin/tags/:id ─────────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, tagSchema.partial())

    const existing = await db.tag.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Tag not found', 404)
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.slug !== undefined || body.name !== undefined) {
      const slug = slugify(body.slug || (body.name as string))
      const owner = await db.tag.findUnique({ where: { slug } })
      if (owner && owner.id !== id) {
        throw new ApiError('A tag with this slug already exists', 400)
      }
      data.slug = slug
    }

    const tag = await db.tag.update({ where: { id }, data })
    res.json({ data: tag })
  })
)

// ─── DELETE /api/admin/tags/:id ──────────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.tag.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Tag not found', 404)
    }

    await db.tag.update({ where: { id }, data: { isDeleted: true } })
    res.json({ message: 'Tag deleted' })
  })
)

export default router

