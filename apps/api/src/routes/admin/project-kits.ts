// Admin project-kit routes: list, create, get, update, delete + items sub-routes.
// Migrated from:
//   apps/web/src/app/api/admin/project-kits/route.ts
//   apps/web/src/app/api/admin/project-kits/[id]/route.ts
//   apps/web/src/app/api/admin/project-kits/[id]/items/route.ts
//   apps/web/src/app/api/admin/project-kits/[id]/items/[itemId]/route.ts
//
// Mounted at /api/admin/project-kits

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  parseJsonField,
  stringifyJsonField,
  getPagination,
  listResponse,
} from '../../lib/helpers.js'
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

const PRODUCT_INCLUDE = {
  select: {
    id: true,
    name: true,
    price: true,
    salePrice: true,
    stock: true,
    images: true,
    sku: true,
  },
}

const createKitSchema = z.object({
  title: z.string().min(1).max(200),
  titleBn: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().min(1).max(10000),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  category: z.string().max(100).optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  price: z.number().min(0),
  salePrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
})

const updateKitSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    titleBn: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().min(1).max(10000).optional(),
    coverImage: z.string().optional(),
    images: z.array(z.string()).optional(),
    category: z.string().max(100).optional(),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    price: z.number().min(0).optional(),
    salePrice: z.number().min(0).optional(),
    stock: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).optional().default(1),
  isRequired: z.boolean().optional().default(true),
  notes: z.string().max(500).optional(),
})

const updateItemSchema = z
  .object({
    quantity: z.number().int().min(1).optional(),
    isRequired: z.boolean().optional(),
    notes: z.string().max(500).optional(),
  })
  .passthrough()

// ─── GET /api/admin/project-kits ─────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleBn: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ]
    }

    const [kits, total] = await Promise.all([
      db.projectKit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { items: true } } },
      }),
      db.projectKit.count({ where }),
    ])

    const parsed = kits.map((k: any) => ({
      ...k,
      images: parseJsonField(k.images),
      itemCount: k._count?.items ?? 0,
      _count: undefined,
    }))

    res.json(listResponse(parsed, total, page, limit))
  })
)

// ─── POST /api/admin/project-kits ────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createKitSchema)
    const {
      title, titleBn, slug, description, coverImage, images, category,
      difficulty, price, salePrice, stock, isActive,
    } = body

    let finalSlug = slug || slugify(title)
    const existing = await db.projectKit.findUnique({ where: { slug: finalSlug } })
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`
    }

    const kit = await db.projectKit.create({
      data: {
        title,
        titleBn: titleBn || null,
        slug: finalSlug,
        description,
        coverImage: coverImage || null,
        images: stringifyJsonField(images),
        category: category || null,
        difficulty: difficulty || null,
        price: Number(price),
        salePrice: salePrice !== undefined ? Number(salePrice) : null,
        stock: Number(stock),
        isActive: !!isActive,
      },
    })

    await cache.del('project-kits:active')

    res.status(201).json({
      data: { ...kit, images: parseJsonField(kit.images) },
    })
  })
)

// ─── GET /api/admin/project-kits/:id ─────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const kit = await db.projectKit.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: PRODUCT_INCLUDE },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!kit) {
      throw new ApiError('Kit not found', 404)
    }

    res.json({ data: { ...kit, images: parseJsonField(kit.images) } })
  })
)

// ─── PUT /api/admin/project-kits/:id ─────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateKitSchema)

    const existing = await db.projectKit.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Kit not found', 404)
    }

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.titleBn !== undefined) data.titleBn = body.titleBn || null
    if (body.slug !== undefined) {
      const dupe = await db.projectKit.findFirst({
        where: { slug: body.slug, NOT: { id } },
      })
      if (dupe) {
        throw new ApiError('Slug already in use', 400)
      }
      data.slug = body.slug
    }
    if (body.description !== undefined) data.description = body.description
    if (body.coverImage !== undefined) data.coverImage = body.coverImage || null
    if (body.images !== undefined) data.images = stringifyJsonField(body.images)
    if (body.category !== undefined) data.category = body.category || null
    if (body.difficulty !== undefined) data.difficulty = body.difficulty || null
    if (body.price !== undefined) data.price = Number(body.price)
    if (body.salePrice !== undefined) {
      data.salePrice = body.salePrice !== null ? Number(body.salePrice) : null
    }
    if (body.stock !== undefined) data.stock = Number(body.stock)
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    const kit = await db.projectKit.update({ where: { id }, data })

    await cache.del('project-kits:active')

    res.json({ data: { ...kit, images: parseJsonField(kit.images) } })
  })
)

// ─── DELETE /api/admin/project-kits/:id ──────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.projectKit.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Kit not found', 404)
    }

    await db.projectKit.delete({ where: { id } })

    await cache.del('project-kits:active')

    res.json({ message: 'Kit deleted' })
  })
)

// ─── GET /api/admin/project-kits/:id/items ───────────────────────────────────

router.get(
  '/:id/items',
  asyncHandler(async (req, res) => {
    const { id: kitId } = req.params

    const kit = await db.projectKit.findUnique({ where: { id: kitId } })
    if (!kit) {
      throw new ApiError('Kit not found', 404)
    }

    const items = await db.projectKitItem.findMany({
      where: { kitId },
      include: { product: PRODUCT_INCLUDE },
      orderBy: { createdAt: 'asc' },
    })

    res.json({ data: items })
  })
)

// ─── POST /api/admin/project-kits/:id/items ──────────────────────────────────

router.post(
  '/:id/items',
  asyncHandler(async (req, res) => {
    const { id: kitId } = req.params
    const body = validateBody(req, addItemSchema)

    const kit = await db.projectKit.findUnique({ where: { id: kitId } })
    if (!kit) {
      throw new ApiError('Kit not found', 404)
    }

    const product = await db.product.findUnique({ where: { id: body.productId } })
    if (!product) {
      throw new ApiError('Product not found', 404)
    }

    // Prevent duplicates — if already added, just update quantity.
    const existing = await db.projectKitItem.findFirst({
      where: { kitId, productId: body.productId },
    })
    if (existing) {
      const updated = await db.projectKitItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + body.quantity },
        include: { product: PRODUCT_INCLUDE },
      })
      return res.json({ data: updated, message: 'Quantity updated' })
    }

    const item = await db.projectKitItem.create({
      data: {
        kitId,
        productId: body.productId,
        quantity: body.quantity,
        isRequired: body.isRequired,
        notes: body.notes || null,
      },
      include: { product: PRODUCT_INCLUDE },
    })

    res.status(201).json({ data: item, message: 'Item added to kit' })
  })
)

// ─── PUT /api/admin/project-kits/:id/items/:itemId ───────────────────────────

router.put(
  '/:id/items/:itemId',
  asyncHandler(async (req, res) => {
    const { id: kitId, itemId } = req.params
    const body = validateBody(req, updateItemSchema)

    const existing = await db.projectKitItem.findFirst({
      where: { id: itemId, kitId },
    })
    if (!existing) {
      throw new ApiError('Kit item not found', 404)
    }

    const data: any = {}
    if (body.quantity !== undefined) data.quantity = Math.max(1, Number(body.quantity) || 1)
    if (body.isRequired !== undefined) data.isRequired = !!body.isRequired
    if (body.notes !== undefined) data.notes = body.notes || null

    const updated = await db.projectKitItem.update({
      where: { id: itemId },
      data,
      include: { product: PRODUCT_INCLUDE },
    })

    res.json({ data: updated, message: 'Kit item updated' })
  })
)

// ─── DELETE /api/admin/project-kits/:id/items/:itemId ────────────────────────

router.delete(
  '/:id/items/:itemId',
  asyncHandler(async (req, res) => {
    const { id: kitId, itemId } = req.params

    const existing = await db.projectKitItem.findFirst({
      where: { id: itemId, kitId },
    })
    if (!existing) {
      throw new ApiError('Kit item not found', 404)
    }

    await db.projectKitItem.delete({ where: { id: itemId } })
    res.json({ message: 'Item removed from kit' })
  })
)

export default router
