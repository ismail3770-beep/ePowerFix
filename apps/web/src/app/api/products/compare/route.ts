import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { parseJsonField } from '@/lib/admin-api'

/**
 * GET /api/products/compare?ids=id1,id2,id3
 * Returns up to 4 products for side-by-side comparison.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const idsParam = url.searchParams.get('ids') || ''
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4)

    if (ids.length === 0) {return jsonResponse({ data: [] })}

    const products = await db.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { category: true, brand: true },
    })

    // Preserve the order requested by the user.
    const ordered = ids
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as typeof products

    const parsed = ordered.map((p: any) => ({
      ...p,
      images: parseJsonField(p.images),
      tags: parseJsonField(p.tags),
    }))

    return jsonResponse({ data: parsed })
  } catch (err: any) {
    console.error('public/products/compare GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
