import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { parseJsonField } from '@/lib/admin-api'
import { cache, cacheKeys } from '@/lib/cache'

/**
 * GET /api/project-kits
 * Public list of active project kits (sellable bundles).
 * Query: search, category
 *
 * Cached for 5 minutes (TTL 300s) under the single key 'project-kits:active'.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const category = url.searchParams.get('category') || undefined

    // Skip cache when any filter is present to avoid cache poisoning
    const hasExtraFilters = !!(search || category)

    const fetchKits = async () => {
      const where: any = { isActive: true }
      if (category) where.category = category
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { titleBn: { contains: search } },
          { description: { contains: search } },
          { category: { contains: search } },
        ]
      }

      return await db.projectKit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true } },
        },
      })
    }

    const kits = hasExtraFilters
      ? await fetchKits()
      : await cache.getOrSet(cacheKeys.projectKits(), 300, fetchKits)

    const parsed = kits.map((k: any) => ({
      ...k,
      images: parseJsonField(k.images),
      itemCount: k._count?.items ?? 0,
      _count: undefined,
    }))

    return jsonResponse({ data: parsed })
  } catch (err: any) {
    console.error('public/project-kits GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
