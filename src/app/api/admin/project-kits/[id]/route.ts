import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'
import { parseJsonField, stringifyJsonField } from '@/lib/admin-api'

/**
 * GET /api/admin/project-kits/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const kit = await db.projectKit.findUnique({
      where: { id },
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

    return jsonResponse({
      data: {
        ...kit,
        images: parseJsonField(kit.images),
      },
    })
  } catch (err: any) {
    console.error('admin/project-kits/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/project-kits/[id]
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

    const existing = await db.projectKit.findUnique({ where: { id } })
    if (!existing) return errorResponse('Kit not found', 404)

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.titleBn !== undefined) data.titleBn = body.titleBn || null
    if (body.slug !== undefined) {
      const dupe = await db.projectKit.findFirst({ where: { slug: body.slug, NOT: { id } } })
      if (dupe) return errorResponse('Slug already in use', 400)
      data.slug = body.slug
    }
    if (body.description !== undefined) data.description = body.description
    if (body.coverImage !== undefined) data.coverImage = body.coverImage || null
    if (body.images !== undefined) data.images = stringifyJsonField(body.images)
    if (body.category !== undefined) data.category = body.category || null
    if (body.difficulty !== undefined) data.difficulty = body.difficulty || null
    if (body.price !== undefined) data.price = Number(body.price)
    if (body.salePrice !== undefined) data.salePrice = body.salePrice !== null ? Number(body.salePrice) : null
    if (body.stock !== undefined) data.stock = Number(body.stock)
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    const kit = await db.projectKit.update({
      where: { id },
      data,
    })

    return jsonResponse({
      data: {
        ...kit,
        images: parseJsonField(kit.images),
      },
    })
  } catch (err: any) {
    console.error('admin/project-kits/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/project-kits/[id]
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.projectKit.findUnique({ where: { id } })
    if (!existing) return errorResponse('Kit not found', 404)

    await db.projectKit.delete({ where: { id } })
    return jsonResponse({ message: 'Kit deleted' })
  } catch (err: any) {
    console.error('admin/project-kits/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
