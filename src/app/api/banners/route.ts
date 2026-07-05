import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'

/**
 * GET /api/banners
 * Public list of active banners. Query: type (hero|services|promo)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || undefined

    const where: any = { isActive: true }
    if (type) where.type = type

    const banners = await db.banner.findMany({
      where,
      orderBy: { position: 'asc' },
    })

    return jsonResponse({ data: banners })
  } catch (err: any) {
    console.error('public/banners GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
