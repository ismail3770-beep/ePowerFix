import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'

/**
 * GET /api/product-categories
 * Public list of active product categories (for shop filters / menus).
 */
export async function GET(_request: NextRequest) {
  try {
    const categories = await db.productCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return jsonResponse({ data: categories })
  } catch (err: any) {
    console.error('public/product-categories GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
