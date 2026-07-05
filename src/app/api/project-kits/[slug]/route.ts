import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { parseJsonField } from '@/lib/admin-api'

/**
 * GET /api/project-kits/[slug]
 * Public project kit detail by slug.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const kit = await db.projectKit.findFirst({
      where: { slug, isActive: true },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true, name: true, price: true, salePrice: true,
                stock: true, images: true, sku: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!kit) return errorResponse('Kit not found', 404)

    const parsed = {
      ...kit,
      images: parseJsonField(kit.images),
    }
    return jsonResponse({ data: parsed })
  } catch (err: any) {
    console.error('public/project-kits/[slug] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
