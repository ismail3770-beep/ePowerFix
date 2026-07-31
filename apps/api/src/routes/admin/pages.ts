// Admin CMS-page routes: list, get, create, update, delete.
// Backs the admin "Pages" page (apps/web/src/app/admin/pages).
//
// Mounted at /api/admin/pages

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

const pageSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().optional(),
    content: z.string().optional(),
    isActive: z.boolean().optional(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
  })
  .passthrough()

// ─── GET /api/admin/pages ────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const pages = await db.page.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ data: pages })
  })
)

// ─── GET /api/admin/pages/:id ────────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const page = await db.page.findFirst({ where: { id, isDeleted: false } })
    if (!page) {
      throw new ApiError('Page not found', 404)
    }
    res.json({ data: page })
  })
)

// ─── POST /api/admin/pages ───────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, pageSchema)

    let slug = slugify(body.slug || body.title)
    const existing = await db.page.findUnique({ where: { slug } })
    if (existing && !existing.isDeleted) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    const page = await db.page.create({
      data: {
        title: body.title,
        slug,
        content: body.content || '',
        isActive: body.isActive !== undefined ? !!body.isActive : true,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
      },
    })
    res.status(201).json({ data: page })
  })
)

// ─── PUT /api/admin/pages/:id ────────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, pageSchema.partial())

    const existing = await db.page.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Page not found', 404)
    }

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.slug !== undefined || body.title !== undefined) {
      const slug = slugify(body.slug || (body.title as string))
      const owner = await db.page.findUnique({ where: { slug } })
      if (owner && owner.id !== id) {
        throw new ApiError('A page with this slug already exists', 400)
      }
      data.slug = slug
    }
    if (body.content !== undefined) data.content = body.content
    if (body.isActive !== undefined) data.isActive = !!body.isActive
    if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle || null
    if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription || null

    const page = await db.page.update({ where: { id }, data })
    res.json({ data: page })
  })
)

// ─── DELETE /api/admin/pages/:id ─────────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.page.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Page not found', 404)
    }

    await db.page.update({ where: { id }, data: { isDeleted: true, isActive: false } })
    res.json({ message: 'Page deleted' })
  })
)

export default router

