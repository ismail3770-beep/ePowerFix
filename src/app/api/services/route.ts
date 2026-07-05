import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { parseJsonField } from '@/lib/admin-api'

/**
 * GET /api/services
 * Public list of active services.
 * Query: category (id/slug), search, featured
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const categoryParam = url.searchParams.get('category') || url.searchParams.get('categoryId') || undefined
    const search = url.searchParams.get('search') || ''
    const featured = url.searchParams.get('featured') === 'true'

    const where: any = { isActive: true }
    if (featured) where.isFeatured = true
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

    const services = await db.service.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      include: { category: true },
    })

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
