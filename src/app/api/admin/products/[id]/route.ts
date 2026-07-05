import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
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
 * GET /api/admin/products/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
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
  } catch (err: any) {
    console.error('admin/products/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/products/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) return errorResponse('Product not found', 404)

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
      isBestDeal,
      hasVariant,
      isDigital,
      digitalFile,
      downloadLimit,
      isActive,
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

    return jsonResponse({
      data: {
        ...product,
        images: parseJsonField(product.images),
        tags: parseJsonField(product.tags),
      },
    })
  } catch (err: any) {
    console.error('admin/products/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/products/[id] — soft-delete (set isDeleted=true).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) return errorResponse('Product not found', 404)

    await db.product.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    return jsonResponse({ message: 'Product deleted' })
  } catch (err: any) {
    console.error('admin/products/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
