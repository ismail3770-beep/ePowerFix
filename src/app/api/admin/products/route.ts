import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  getPagination,
  listResponse,
  parseJsonField,
  stringifyJsonField,
} from '@/lib/admin-api'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'
import { cache } from '@/lib/cache'
import { startSpan } from '@/lib/monitoring'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

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
  categoryId: z.string().min(1),
  brandId: z.string().min(1),
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

// ─── GET: List products ──────────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const { page, limit, skip, search } = getPagination(request.url)
  const url = new URL(request.url)
  const categoryId = url.searchParams.get('categoryId') || undefined
  const brandId = url.searchParams.get('brandId') || undefined
  const isActiveParam = url.searchParams.get('isActive')
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

  const span = startSpan('admin.products.list')
  try {
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

    return listResponse(parsed, total, page, limit)
  } finally {
    span.finish()
  }
})

// ─── POST: Create product ────────────────────────────────────────────────────

export const POST = adminRoute(createProductSchema, async (request, body, user) => {
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

  // SKU uniqueness check (if provided)
  if (sku) {
    const skuExists = await db.product.findUnique({ where: { sku } })
    if (skuExists) return errorResponse('SKU already exists', 400)
  }

  const product = await db.product.create({
    data: {
      name,
      nameBn: nameBn || null,
      slug: finalSlug,
      description,
      shortDesc: shortDesc || null,
      price: Number(price),
      salePrice: salePrice !== undefined ? Number(salePrice) : comparePrice !== undefined ? Number(comparePrice) : null,
      costPrice: costPrice !== undefined ? Number(costPrice) : null,
      sku: sku || null,
      stock: Number(stock),
      minStock: Number(minStock),
      categoryId,
      brandId,
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

  // Invalidate the public products cache so the new item shows up.
  await cache.invalidatePattern('products:*')

  return jsonResponse({
    data: {
      ...product,
      images: parseJsonField(product.images),
      tags: parseJsonField(product.tags),
    },
  }, 201)
})
