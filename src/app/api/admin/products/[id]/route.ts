import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseJsonField,
  stringifyJsonField,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'
import { cache } from '@/lib/cache'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Zod Schema for PUT (partial — all fields optional) ──────────────────────

const updateProductSchema = z.object({
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
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
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
}).passthrough()

// ─── GET ──────────────────────────────────────────────────────────────────────

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const product = await db.product.findUnique({
    where: { id },
    include: { category: true, brand: true },
  })
  if (!product) return errorResponse('Product not found', 404)

  return jsonResponse({
    data: {
      ...product,
      images: parseJsonField(product.images),
      tags: parseJsonField(product.tags),
    },
  })
})

// ─── PUT ──────────────────────────────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const body = await validateBody(request, updateProductSchema)

  const existing = await db.product.findUnique({ where: { id } })
  if (!existing) return errorResponse('Product not found', 404)

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
      return errorResponse('Slug already in use', 400)
    }
  }

  // SKU uniqueness
  if (sku !== undefined && sku !== existing.sku) {
    if (sku) {
      const skuOwner = await db.product.findUnique({ where: { sku } })
      if (skuOwner && skuOwner.id !== id) {
        return errorResponse('SKU already in use', 400)
      }
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
  if (categoryId !== undefined) data.categoryId = categoryId
  if (brandId !== undefined) data.brandId = brandId
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

  // Invalidate the public products cache so the updated item shows up.
  await cache.invalidatePattern('products:*')

  return jsonResponse({
    data: {
      ...product,
      images: parseJsonField(product.images),
      tags: parseJsonField(product.tags),
    },
  })
})

// ─── DELETE (soft-delete) ─────────────────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const existing = await db.product.findUnique({ where: { id } })
  if (!existing) return errorResponse('Product not found', 404)

  await db.product.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  })

  // Invalidate the public products cache so the deleted item is removed.
  await cache.invalidatePattern('products:*')

  return jsonResponse({ message: 'Product deleted' })
})
