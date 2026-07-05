import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { cache, cacheKeys } from '@/lib/cache'

/**
 * GET /api/brands
 * Public list of active brands — cached for 5 minutes.
 */
export async function GET(_request: NextRequest) {
  try {
    const brands = await cache.getOrSet(cacheKeys.brands(), 300, async () => {
      return await db.brand.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      })
    })
    return jsonResponse({ data: brands })
  } catch (err: any) {
    console.error('public/brands GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
