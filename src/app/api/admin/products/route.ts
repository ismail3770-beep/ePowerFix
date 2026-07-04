import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
  getPagination,
  listResponse,
  parseJsonField,
  stringifyJsonField,
} from '@/lib/admin-api'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * GET /api/admin/products
 * List products with pagination, search, categoryId, brandId, isActive filters.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
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

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          brand: true,
        },
      }),
      db.product.count({ where }),
    ])

    const parsed = products.map((p: any) => ({
      ...p,
      images: parseJsonField(p.images),
      tags: parseJsonField(p.tags),
    }))

    return listResponse(parsed, total, page, limit)
  } catch (err: any) {
    console.error('admin/products GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/products
 * Create a product. images/tags arrays are JSON-stringified for SQLite.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const {
      name,
      nameBn,
      slug,
      description,
      shortDesc,
      price,
      comparePrice,
      salePrice,
      costPrice,
      sku,
      stock,
      minStock,
      categoryId,
      brandId,
      images,
      tags,
      specs,
      isFeatured,
      hasVariant,
      isDigital,
      digitalFile,
      downloadLimit,
      isActive,
    } = body

    if (!name) return errorResponse('name is required', 400)
    if (!description) return errorResponse('description is required', 400)
    if (price === undefined || price === null)
      return errorResponse('price is required', 400)
    if (!categoryId) return errorResponse('categoryId is required', 400)
    if (!brandId) return errorResponse('brandId is required', 400)

    // Auto-generate slug if not provided; ensure uniqueness.
    let finalSlug = slug || slugify(name)
    const existing = await db.product.findUnique({
      where: { slug: finalSlug },
    })
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
        salePrice:
          salePrice !== undefined
            ? Number(salePrice)
            : comparePrice !== undefined
            ? Number(comparePrice)
            : null,
        costPrice: costPrice !== undefined ? Number(costPrice) : null,
        sku: sku || null,
        stock: stock !== undefined ? Number(stock) : 0,
        minStock: minStock !== undefined ? Number(minStock) : 5,
        categoryId,
        brandId,
        images: stringifyJsonField(images),
        tags: stringifyJsonField(tags),
        specs: specs || null,
        isFeatured: !!isFeatured,
        hasVariant: !!hasVariant,
        isDigital: !!isDigital,
        digitalFile: digitalFile || null,
        downloadLimit: downloadLimit !== undefined ? Number(downloadLimit) : null,
        isActive: isActive !== undefined ? !!isActive : true,
      },
      include: { category: true, brand: true },
    })

    return jsonResponse({
      data: {
        ...product,
        images: parseJsonField(product.images),
        tags: parseJsonField(product.tags),
      },
    }, 201)
  } catch (err: any) {
    console.error('admin/products POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
