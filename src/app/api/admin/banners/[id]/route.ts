import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

/**
 * GET /api/admin/banners/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const banner = await db.banner.findUnique({ where: { id } })
    if (!banner) return errorResponse('Banner not found', 404)
    return jsonResponse({ data: banner })
  } catch (err: any) {
    console.error('admin/banners/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/banners/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) return errorResponse('Banner not found', 404)

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.subtitle !== undefined) data.subtitle = body.subtitle || null
    if (body.image !== undefined) data.image = body.image
    if (body.link !== undefined) data.link = body.link || null
    if (body.type !== undefined) data.type = body.type
    if (body.position !== undefined && body.position !== null) {
      data.position = Number(body.position)
    }
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    const banner = await db.banner.update({ where: { id }, data })
    return jsonResponse({ data: banner })
  } catch (err: any) {
    console.error('admin/banners/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/banners/[id] — hard delete (Banner has no isDeleted column).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) return errorResponse('Banner not found', 404)

    await db.banner.delete({ where: { id } })

    return jsonResponse({ message: 'Banner deleted' })
  } catch (err: any) {
    console.error('admin/banners/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
