import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { parseJsonField, getPagination, listResponse } from '@/lib/admin-api'

/**
 * GET /api/products
 * Public storefront product listing.
 * Query params: page, limit, search, category (id or slug), brandId, countOnly, featured, sort
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const countOnly = url.searchParams.get('countOnly') === 'true'

    // If only a count is requested (used by header badges etc.)
    if (countOnly) {
      const total = await db.product.count({ where: { isActive: true } })
      return jsonResponse({ data: { total } })
    }

    const { page, limit, skip, search } = getPagination(request.url)
    const categoryParam = url.searchParams.get('category') || url.searchParams.get('categoryId') || undefined
    const brandId = url.searchParams.get('brandId') || undefined
    const featured = url.searchParams.get('featured')
    const sort = url.searchParams.get('sort') || 'featured'

    const where: any = { isActive: true }

    // category may be an id or a slug — resolve to id.
    if (categoryParam) {
      const cat = await db.productCategory.findFirst({
        where: { OR: [{ id: categoryParam }, { slug: categoryParam }] },
        select: { id: true },
      })
      if (cat) where.categoryId = cat.id
      else where.categoryId = categoryParam
    }
    if (brandId) where.brandId = brandId
    if (featured === 'true') where.isFeatured = true
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameBn: { contains: search } },
        { sku: { contains: search } },
        { slug: { contains: search } },
        { shortDesc: { contains: search } },
      ]
    }

    // Sorting
    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'price-asc') orderBy = { price: 'asc' }
    else if (sort === 'price-desc') orderBy = { price: 'desc' }
    else if (sort === 'rating') orderBy = { rating: 'desc' }
    else if (sort === 'featured') orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }]

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
  } catch (err: any) {
    console.error('public/products GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
