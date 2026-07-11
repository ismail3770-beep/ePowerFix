import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { cache, cacheKeys } from '@/lib/cache'

/**
 * GET /api/banners
 * Public list of active banners. Query: type (hero|services|promo)
 *
 * Cached for 5 minutes (TTL 300s) keyed on the requested banner type.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || undefined

    const banners = await cache.getOrSet(cacheKeys.banners(type), 300, async () => {
      const where: any = { isActive: true }
      if (type) {where.type = type}

      return await db.banner.findMany({
        where,
        orderBy: { position: 'asc' },
      })
    })

    return jsonResponse({ data: banners })
  } catch (err: any) {
    console.error('public/banners GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
