// Admin product-category routes: list, create, get, update, delete.
// Migrated from apps/web/src/app/api/admin/product-categories/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/categories

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

const createCategorySchema = z
  .object({
    name: z.string().min(1),
    nameBn: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    icon: z.string().optional(),
    parentId: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .passthrough()

const updateCategorySchema = z
  .object({
    name: z.string().optional(),
    nameBn: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    icon: z.string().optional(),
    parentId: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .passthrough()

// ─── GET /api/admin/categories ───────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await db.productCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
      },
    })
    res.json({ data: categories })
  })
)

// ─── POST /api/admin/categories ──────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createCategorySchema)
    const { name, nameBn, slug, image, icon, parentId, isActive, sortOrder } = body
    if (!name) {
      throw new ApiError('name is required', 400)
    }

    let finalSlug = slug || slugify(name)
    const slugExists = await db.productCategory.findUnique({
      where: { slug: finalSlug },
    })
    if (slugExists) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`
    }

    const category = await db.productCategory.create({
      data: {
        name,
        nameBn: nameBn || name,
        slug: finalSlug,
        image: image || null,
        icon: icon || null,
        parentId: parentId || null,
        isActive: isActive !== undefined ? !!isActive : true,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
      },
      include: { _count: { select: { products: true } } },
    })

    await cache.del('categories:counts')
    await cache.del('categories:no-counts')

    res.status(201).json({ data: category })
  })
)

// ─── GET /api/admin/categories/:id ───────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const category = await db.productCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, slug: true } },
      },
    })
    if (!category) {
      throw new ApiError('Category not found', 404)
    }
    res.json({ data: category })
  })
)

// ─── PUT /api/admin/categories/:id ───────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateCategorySchema)

    const existing = await db.productCategory.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Category not found', 404)
    }

    const { name, nameBn, slug, image, icon, parentId, isActive, sortOrder } = body

    if (slug !== undefined && slug !== existing.slug) {
      const finalSlug = slug || (name ? slugify(name) : existing.slug)
      const slugOwner = await db.productCategory.findUnique({
        where: { slug: finalSlug },
      })
      if (slugOwner && slugOwner.id !== id) {
        throw new ApiError('Slug already in use', 400)
      }
    }

    if (parentId !== undefined && parentId === id) {
      throw new ApiError('A category cannot be its own parent', 400)
    }

    const data: any = {}
    if (name !== undefined) data.name = name
    if (nameBn !== undefined) data.nameBn = nameBn || existing.name
    if (slug !== undefined) {
      data.slug = slug || (name ? slugify(name) : existing.slug)
    }
    if (image !== undefined) data.image = image || null
    if (icon !== undefined) data.icon = icon || null
    if (parentId !== undefined) data.parentId = parentId || null
    if (isActive !== undefined) data.isActive = !!isActive
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder)

    const category = await db.productCategory.update({
      where: { id },
      data,
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, slug: true } },
      },
    })

    await cache.del('categories:counts')
    await cache.del('categories:no-counts')

    res.json({ data: category })
  })
)

// ─── DELETE /api/admin/categories/:id ────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.productCategory.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Category not found', 404)
    }

    await db.productCategory.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    await cache.del('categories:counts')
    await cache.del('categories:no-counts')

    res.json({ message: 'Category deleted' })
  })
)

export default router
