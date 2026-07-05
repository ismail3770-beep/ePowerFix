import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * GET /api/admin/service-categories/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const category = await db.serviceCategory.findUnique({
      where: { id },
      include: { _count: { select: { services: true } } },
    })
    if (!category) return errorResponse('Category not found', 404)
    return jsonResponse({ data: category })
  } catch (err: any) {
    console.error('admin/service-categories/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/service-categories/[id]
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

    const existing = await db.serviceCategory.findUnique({ where: { id } })
    if (!existing) return errorResponse('Category not found', 404)

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.nameBn !== undefined) data.nameBn = body.nameBn || existing.name
    if (body.icon !== undefined) data.icon = body.icon || null
    if (body.image !== undefined) data.image = body.image || null
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder)
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    if (body.slug !== undefined && body.slug !== existing.slug) {
      const finalSlug = body.slug || slugify(body.name || existing.name)
      const owner = await db.serviceCategory.findUnique({
        where: { slug: finalSlug },
      })
      if (owner && owner.id !== id) {
        return errorResponse('Slug already in use', 400)
      }
      data.slug = finalSlug
    }

    const category = await db.serviceCategory.update({
      where: { id },
      data,
      include: { _count: { select: { services: true } } },
    })

    return jsonResponse({ data: category })
  } catch (err: any) {
    console.error('admin/service-categories/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/service-categories/[id] — soft-delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.serviceCategory.findUnique({ where: { id } })
    if (!existing) return errorResponse('Category not found', 404)

    await db.serviceCategory.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    return jsonResponse({ message: 'Category deleted' })
  } catch (err: any) {
    console.error('admin/service-categories/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
