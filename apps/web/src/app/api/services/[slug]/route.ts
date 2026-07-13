import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { parseJsonField } from '@/lib/admin-api'

/**
 * GET /api/services/[slug]
 * Public service detail by slug.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const service = await db.service.findFirst({
      where: { slug, isActive: true },
      include: {
        category: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!service) {return errorResponse('Service not found', 404)}

    const parsed = {
      ...service,
      images: parseJsonField(service.images),
    }
    // Frontend expects `data` to be the service object directly.
    return jsonResponse({ data: parsed })
  } catch (err: any) {
    console.error('public/services/[slug] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
