// Admin brand routes: list, create, get, update, delete.
// Migrated from apps/web/src/app/api/admin/brands/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/brands

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import { cache } from '../../lib/cache.js'

const router = Router()

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const createBrandSchema = z
  .object({
    name: z.string().min(1),
    nameBn: z.string().optional(),
    slug: z.string().optional(),
    logo: z.string().optional(),
    country: z.string().optional(),
    website: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

const updateBrandSchema = z
  .object({
    name: z.string().optional(),
    nameBn: z.string().optional(),
    slug: z.string().optional(),
    logo: z.string().optional(),
    country: z.string().optional(),
    website: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

// ─── GET /api/admin/brands ───────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const brands = await db.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    })
    res.json({ data: brands })
  })
)

// ─── POST /api/admin/brands ──────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createBrandSchema)
    const { name, nameBn, slug, logo, country, website, isActive } = body
    if (!name) {
      throw new ApiError('name is required', 400)
    }

    let finalSlug = slug || slugify(name)
    const slugExists = await db.brand.findUnique({ where: { slug: finalSlug } })
    if (slugExists) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`
    }

    const brand = await db.brand.create({
      data: {
        name,
        nameBn: nameBn || null,
        slug: finalSlug,
        logo: logo || null,
        country: country || null,
        website: website || null,
        isActive: isActive !== undefined ? !!isActive : true,
      },
      include: { _count: { select: { products: true } } },
    })

    await cache.del('brands:all')

    res.status(201).json({ data: brand })
  })
)

// ─── GET /api/admin/brands/:id ───────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const brand = await db.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
    if (!brand) {
      throw new ApiError('Brand not found', 404)
    }
    res.json({ data: brand })
  })
)

// ─── PUT /api/admin/brands/:id ───────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateBrandSchema)

    const existing = await db.brand.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Brand not found', 404)
    }

    const { name, nameBn, slug, logo, country, website, isActive } = body

    if (slug !== undefined && slug !== existing.slug) {
      const finalSlug = slug || (name ? slugify(name) : existing.slug)
      const slugOwner = await db.brand.findUnique({ where: { slug: finalSlug } })
      if (slugOwner && slugOwner.id !== id) {
        throw new ApiError('Slug already in use', 400)
      }
    }

    const data: any = {}
    if (name !== undefined) data.name = name
    if (nameBn !== undefined) data.nameBn = nameBn || null
    if (slug !== undefined) {
      data.slug = slug || (name ? slugify(name) : existing.slug)
    }
    if (logo !== undefined) data.logo = logo || null
    if (country !== undefined) data.country = country || null
    if (website !== undefined) data.website = website || null
    if (isActive !== undefined) data.isActive = !!isActive

    const brand = await db.brand.update({
      where: { id },
      data,
      include: { _count: { select: { products: true } } },
    })

    await cache.del('brands:all')

    res.json({ data: brand })
  })
)

// ─── DELETE /api/admin/brands/:id ────────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.brand.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Brand not found', 404)
    }

    await db.brand.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    await cache.del('brands:all')

    res.json({ message: 'Brand deleted' })
  })
)

export default router
