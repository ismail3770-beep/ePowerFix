import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'

/**
 * GET /api/brands
 * Public list of active brands (for shop filters).
 */
export async function GET(_request: NextRequest) {
  try {
    const brands = await db.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return jsonResponse({ data: brands })
  } catch (err: any) {
    console.error('public/brands GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
