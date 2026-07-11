import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { parseJsonField } from '@/lib/admin-api'
import { cache, cacheKeys } from '@/lib/cache'

/**
 * GET /api/services
 * Public list of active services.
 * Query: category (id/slug), search, featured
 *
 * Cached for 5 minutes (TTL 300s) under the single key 'services:active'.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const categoryParam = url.searchParams.get('category') || url.searchParams.get('categoryId') || undefined
    const search = url.searchParams.get('search') || ''
    const featured = url.searchParams.get('featured') === 'true'

    // Skip cache when any filter is present to avoid cache poisoning
    const hasExtraFilters = !!(categoryParam || search || featured)

    const fetchServices = async () => {
      const where: any = { isActive: true }
      if (featured) {where.isFeatured = true}
      if (categoryParam) {
        const cat = await db.serviceCategory.findFirst({
          where: { OR: [{ id: categoryParam }, { slug: categoryParam }] },
          select: { id: true },
        })
        where.categoryId = cat?.id ?? categoryParam
      }
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { nameBn: { contains: search } },
          { description: { contains: search } },
        ]
      }

      return await db.service.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: { category: true },
      })
    }

    const services = hasExtraFilters
      ? await fetchServices()
      : await cache.getOrSet(cacheKeys.services(), 300, fetchServices)

    const parsed = services.map((s: any) => ({
      ...s,
      images: parseJsonField(s.images),
    }))

    // Return both shapes for compatibility:
    //  - ServicesSection reads `data.data.services`
    //  - ServiceBookingDialog reads `data.services` (top-level)
    return jsonResponse({ data: { services: parsed }, services: parsed })
  } catch (err: any) {
    console.error('public/services GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
