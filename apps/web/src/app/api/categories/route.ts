import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { publicGetRoute, z } from '@/lib/api-handler'
import { cache, cacheKeys } from '@/lib/cache'
import { startSpan } from '@/lib/monitoring'

interface CategoryWithCount {
  id: string
  name: string
  nameBn: string | null
  slug: string
  icon: string | null
  image: string | null
  sortOrder: number
  _count: { products: number }
}

/**
 * GET /api/categories
 * Returns all active product categories with product counts.
 * Cached for 5 minutes.
 */
export const GET = publicGetRoute(async (request: NextRequest) => {
  const url = new URL(request.url)
  const includeCounts = url.searchParams.get('counts') !== 'false'

  const fetchCategories = async () => {
    const span = startSpan('categories.list')
    try {
      return await db.productCategory.findMany({
        where: { isActive: true, isDeleted: false },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          name: true,
          nameBn: true,
          slug: true,
          icon: true,
          image: true,
          sortOrder: true,
          _count: includeCounts ? { select: { products: true } } : false,
        },
      })
    } finally {
      span.finish()
    }
  }

  const cacheKey = includeCounts ? 'categories:with-counts' : 'categories:no-counts'
  const categories = await cache.getOrSet(cacheKey, 300, fetchCategories)

  return Response.json({ categories })
})