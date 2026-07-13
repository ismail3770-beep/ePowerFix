// Admin banner routes: list, create, get, update, delete, toggle.
// Migrated from:
//   apps/web/src/app/api/admin/banners/route.ts
//   apps/web/src/app/api/admin/banners/[id]/route.ts
//   apps/web/src/app/api/admin/banners/[id]/toggle/route.ts
//
// Mounted at /api/admin/banners

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'

const router = Router()

const createBannerSchema = z
  .object({
    title: z.string().min(1),
    image: z.string().min(1),
    link: z.string().optional(),
    subtitle: z.string().optional(),
    type: z.string().optional(),
    position: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

const updateBannerSchema = z
  .object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    image: z.string().optional(),
    link: z.string().optional(),
    type: z.string().optional(),
    position: z.number().int().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

// ─── GET /api/admin/banners ──────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const banners = await db.banner.findMany({
      orderBy: { position: 'asc' },
    })
    res.json({ data: banners })
  })
)

// ─── POST /api/admin/banners ─────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createBannerSchema)

    const title = (body.title || '').toString().trim()
    if (!title) {
      throw new ApiError('title is required', 400)
    }
    const image = (body.image || '').toString().trim()
    if (!image) {
      throw new ApiError('image is required', 400)
    }

    const banner = await db.banner.create({
      data: {
        title,
        subtitle: body.subtitle || null,
        image,
        link: body.link || null,
        type: body.type || 'hero',
        position:
          body.position !== undefined && body.position !== null
            ? Number(body.position)
            : 0,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    res.status(201).json({ data: banner })
  })
)

// ─── GET /api/admin/banners/:id ──────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const banner = await db.banner.findUnique({ where: { id } })
    if (!banner) {
      throw new ApiError('Banner not found', 404)
    }
    res.json({ data: banner })
  })
)

// ─── PUT /api/admin/banners/:id ──────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateBannerSchema)

    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Banner not found', 404)
    }

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.subtitle !== undefined) data.subtitle = body.subtitle || null
    if (body.image !== undefined) data.image = body.image
    if (body.link !== undefined) data.link = body.link || null
    if (body.type !== undefined) data.type = body.type
    if (body.position !== undefined && body.position !== null) {
      data.position = Number(body.position)
    }
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    const banner = await db.banner.update({ where: { id }, data })
    res.json({ data: banner })
  })
)

// ─── DELETE /api/admin/banners/:id ───────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Banner not found', 404)
    }

    await db.banner.delete({ where: { id } })
    res.json({ message: 'Banner deleted' })
  })
)

// ─── PATCH /api/admin/banners/:id/toggle ─────────────────────────────────────

router.patch(
  '/:id/toggle',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Banner not found', 404)
    }

    const banner = await db.banner.update({
      where: { id },
      data: { isActive: !existing.isActive },
    })

    res.json({ data: banner })
  })
)

export default router
