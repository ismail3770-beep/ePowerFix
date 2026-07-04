import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

/**
 * GET /api/admin/banners
 * List all banners ordered by position ascending. No pagination.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const banners = await db.banner.findMany({
      orderBy: { position: 'asc' },
    })
    return jsonResponse({ data: banners })
  } catch (err: any) {
    console.error('admin/banners GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/banners
 * Create a banner. Body: { title, image, link?, position, isActive, startDate?, endDate?, subtitle?, type? }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const title = (body.title || '').toString().trim()
    if (!title) return errorResponse('title is required', 400)

    const image = (body.image || '').toString().trim()
    if (!image) return errorResponse('image is required', 400)

    const banner = await db.banner.create({
      data: {
        title,
        subtitle: body.subtitle || null,
        image,
        link: body.link || null,
        type: body.type || 'hero',
        position:
          body.position !== undefined && body.position !== null
            ? Number(body.position)
            : 0,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })

    return jsonResponse({ data: banner }, 201)
  } catch (err: any) {
    console.error('admin/banners POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
