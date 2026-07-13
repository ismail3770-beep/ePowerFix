// Admin product routes: list, create, get, update, delete.
// Migrated from apps/web/src/app/api/admin/products/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/products

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

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  nameBn: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().min(1).max(10000),
  shortDesc: z.string().max(500).optional(),
  price: z.number().min(0),
  comparePrice: z.number().optional(),
  salePrice: z.number().optional(),
  costPrice: z.number().optional(),
  sku: z.string().max(100).optional(),
  stock: z.number().int().min(0).optional().default(0),
  minStock: z.number().int().min(0).optional().default(5),
  categoryId: z.string().min(1).nullable().optional(),
  brandId: z.string().min(1).nullable().optional(),
  images: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  specs: z.string().optional(),
  isFeatured: z.boolean().optional().default(false),
  isBestDeal: z.boolean().optional().default(false),
  hasVariant: z.boolean().optional().default(false),
  isDigital: z.boolean().optional().default(false),
  digitalFile: z.string().optional(),
  downloadLimit: z.number().int().optional(),
  isActive: z.boolean().optional().default(true),
})

const updateProductSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    nameBn: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().min(1).max(10000).optional(),
    shortDesc: z.string().max(500).optional(),
    price: z.number().min(0).optional(),
    comparePrice: z.number().optional(),
    salePrice: z.number().optional(),
    costPrice: z.number().optional(),
    sku: z.string().max(100).optional(),
    stock: z.number().int().min(0).optional(),
    minStock: z.number().int().min(0).optional(),
    categoryId: z.string().nullable().optional(),
    brandId: z.string().nullable().optional(),
    images: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    specs: z.string().optional(),
    isFeatured: z.boolean().optional(),
    isBestDeal: z.boolean().optional(),
    hasVariant: z.boolean().optional(),
    isDigital: z.boolean().optional(),
    digitalFile: z.string().optional(),
    downloadLimit: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

const INVALID_VALUES = new Set(['', 'none', 'null', 'undefined', '__none__'])

// ─── GET /api/admin/products ─────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)
    const categoryId = query.categoryId || undefined
    const brandId = query.brandId || undefined
    const isActiveParam = query.isActive
    const isActive =
      isActiveParam === null || isActiveParam === undefined
        ? undefined
        : isActiveParam === 'true'

    const where: any = {}
    if (categoryId) where.categoryId = categoryId
    if (brandId) where.brandId = brandId
    if (isActive !== undefined) where.isActive = isActive
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameBn: { contains: search } },
        { sku: { contains: search } },
        { slug: { contains: search } },
      ]
    }

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true, brand: true },
      }),
      db.product.count({ where }),
    ])

    const parsed = products.map((p: any) => ({
      ...p,
      images: parseJsonField(p.images),
      tags: parseJsonField(p.tags),
    }))

    res.json(listResponse(parsed, total, page, limit))
  })
)

// ─── POST /api/admin/products ────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createProductSchema)

    const {
      name, nameBn, slug, description, shortDesc, price,
      comparePrice, salePrice, costPrice, sku, stock, minStock,
      categoryId, brandId, images, tags, specs,
      isFeatured, isBestDeal, hasVariant, isDigital, digitalFile, downloadLimit, isActive,
    } = body

    // Auto-generate slug if not provided; ensure uniqueness.
    let finalSlug = slug || slugify(name)
    const existing = await db.product.findUnique({ where: { slug: finalSlug } })
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`
    }

    // SKU uniqueness check
    if (sku) {
      const skuExists = await db.product.findUnique({ where: { sku } })
      if (skuExists) {
        throw new ApiError('SKU already exists', 400)
      }
    }

    const normalizedCat = typeof categoryId === 'string' ? categoryId.trim() : ''
    const normalizedBrand = typeof brandId === 'string' ? brandId.trim() : ''

    if (!normalizedCat || INVALID_VALUES.has(normalizedCat.toLowerCase())) {
      throw new ApiError('Please select a category for the product.', 400)
    }
    if (!normalizedBrand || INVALID_VALUES.has(normalizedBrand.toLowerCase())) {
      throw new ApiError('Please select a brand for the product.', 400)
    }

    const [catExists, brandExists] = await Promise.all([
      db.productCategory.findUnique({ where: { id: normalizedCat }, select: { id: true } }),
      db.brand.findUnique({ where: { id: normalizedBrand }, select: { id: true } }),
    ])
    if (!catExists) {
      throw new ApiError('Selected category does not exist. Please refresh and try again.', 400)
    }
    if (!brandExists) {
      throw new ApiError('Selected brand does not exist. Please refresh and try again.', 400)
    }

    const product = await db.product.create({
      data: {
        name,
        nameBn: nameBn || null,
        slug: finalSlug,
        description,
        shortDesc: shortDesc || null,
        price: Number(price),
        salePrice:
          salePrice !== undefined
            ? Number(salePrice)
            : comparePrice !== undefined
            ? Number(comparePrice)
            : null,
        costPrice: costPrice !== undefined ? Number(costPrice) : null,
        sku: sku || null,
        stock: Number(stock),
        minStock: Number(minStock),
        categoryId: normalizedCat,
        brandId: normalizedBrand,
        images: stringifyJsonField(images),
        tags: stringifyJsonField(tags),
        specs: specs || null,
        isFeatured: !!isFeatured,
        isBestDeal: !!isBestDeal,
        hasVariant: !!hasVariant,
        isDigital: !!isDigital,
        digitalFile: digitalFile || null,
        downloadLimit: downloadLimit !== undefined ? Number(downloadLimit) : null,
        isActive: isActive !== undefined ? !!isActive : true,
      },
      include: { category: true, brand: true },
    })

    await cache.invalidatePattern('products:*')

    res.status(201).json({
      data: {
        ...product,
        images: parseJsonField(product.images),
        tags: parseJsonField(product.tags),
      },
    })
  })
)

// ─── GET /api/admin/products/:id ─────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const product = await db.product.findUnique({
      where: { id },
      include: { category: true, brand: true },
    })
    if (!product) {
      throw new ApiError('Product not found', 404)
    }

    res.json({
      data: {
        ...product,
        images: parseJsonField(product.images),
        tags: parseJsonField(product.tags),
      },
    })
  })
)

// ─── PUT /api/admin/products/:id ─────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateProductSchema)

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Product not found', 404)
    }

    const {
      name, nameBn, slug, description, shortDesc, price,
      comparePrice, salePrice, costPrice, sku, stock, minStock,
      categoryId, brandId, images, tags, specs,
      isFeatured, isBestDeal, hasVariant, isDigital, digitalFile, downloadLimit, isActive,
    } = body

    // If slug is changing, ensure uniqueness.
    let finalSlug = existing.slug
    if (slug !== undefined && slug !== existing.slug) {
      finalSlug = slug || (name ? slugify(name) : existing.slug)
      const slugOwner = await db.product.findUnique({ where: { slug: finalSlug } })
      if (slugOwner && slugOwner.id !== id) {
        throw new ApiError('Slug already in use', 400)
      }
    }

    // SKU uniqueness
    if (sku !== undefined && sku !== existing.sku) {
      if (sku) {
        const skuOwner = await db.product.findUnique({ where: { sku } })
        if (skuOwner && skuOwner.id !== id) {
          throw new ApiError('SKU already in use', 400)
        }
      }
    }

    let normalizedCatPut: string | undefined = undefined
    let normalizedBrandPut: string | undefined = undefined

    if (categoryId !== undefined) {
      normalizedCatPut = typeof categoryId === 'string' ? categoryId.trim() : ''
      if (!normalizedCatPut || INVALID_VALUES.has(normalizedCatPut.toLowerCase())) {
        throw new ApiError('Please select a valid category for the product.', 400)
      }
      const catExists = await db.productCategory.findUnique({
        where: { id: normalizedCatPut },
        select: { id: true },
      })
      if (!catExists) {
        throw new ApiError('Selected category does not exist.', 400)
      }
    }
    if (brandId !== undefined) {
      normalizedBrandPut = typeof brandId === 'string' ? brandId.trim() : ''
      if (!normalizedBrandPut || INVALID_VALUES.has(normalizedBrandPut.toLowerCase())) {
        throw new ApiError('Please select a valid brand for the product.', 400)
      }
      const brandExists = await db.brand.findUnique({
        where: { id: normalizedBrandPut },
        select: { id: true },
      })
      if (!brandExists) {
        throw new ApiError('Selected brand does not exist.', 400)
      }
    }

    const data: any = {}
    if (name !== undefined) data.name = name
    if (nameBn !== undefined) data.nameBn = nameBn || null
    if (slug !== undefined) data.slug = finalSlug
    if (description !== undefined) data.description = description
    if (shortDesc !== undefined) data.shortDesc = shortDesc || null
    if (price !== undefined) data.price = Number(price)
    if (salePrice !== undefined) data.salePrice = salePrice === null ? null : Number(salePrice)
    else if (comparePrice !== undefined) data.salePrice = comparePrice === null ? null : Number(comparePrice)
    if (costPrice !== undefined) data.costPrice = costPrice === null ? null : Number(costPrice)
    if (sku !== undefined) data.sku = sku || null
    if (stock !== undefined) data.stock = Number(stock)
    if (minStock !== undefined) data.minStock = Number(minStock)
    if (normalizedCatPut !== undefined) data.categoryId = normalizedCatPut
    if (normalizedBrandPut !== undefined) data.brandId = normalizedBrandPut
    if (images !== undefined) data.images = stringifyJsonField(images)
    if (tags !== undefined) data.tags = stringifyJsonField(tags)
    if (specs !== undefined) data.specs = specs || null
    if (isFeatured !== undefined) data.isFeatured = !!isFeatured
    if (isBestDeal !== undefined) data.isBestDeal = !!isBestDeal
    if (hasVariant !== undefined) data.hasVariant = !!hasVariant
    if (isDigital !== undefined) data.isDigital = !!isDigital
    if (digitalFile !== undefined) data.digitalFile = digitalFile || null
    if (downloadLimit !== undefined) data.downloadLimit = downloadLimit === null ? null : Number(downloadLimit)
    if (isActive !== undefined) data.isActive = !!isActive

    const product = await db.product.update({
      where: { id },
      data,
      include: { category: true, brand: true },
    })

    await cache.invalidatePattern('products:*')

    res.json({
      data: {
        ...product,
        images: parseJsonField(product.images),
        tags: parseJsonField(product.tags),
      },
    })
  })
)

// ─── DELETE /api/admin/products/:id (soft-delete) ────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Product not found', 404)
    }

    await db.product.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    await cache.invalidatePattern('products:*')

    res.json({ message: 'Product deleted' })
  })
)

export default router
