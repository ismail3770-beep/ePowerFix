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
 * GET /api/admin/product-categories/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const category = await db.productCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, slug: true } },
      },
    })
    if (!category) return errorResponse('Category not found', 404)
    return jsonResponse({ data: category })
  } catch (err: any) {
    console.error('admin/product-categories/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/product-categories/[id]
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

    const existing = await db.productCategory.findUnique({ where: { id } })
    if (!existing) return errorResponse('Category not found', 404)

    const { name, nameBn, slug, image, icon, parentId, isActive, sortOrder } = body

    // Slug uniqueness
    if (slug !== undefined && slug !== existing.slug) {
      const finalSlug = slug || (name ? slugify(name) : existing.slug)
      const slugOwner = await db.productCategory.findUnique({
        where: { slug: finalSlug },
      })
      if (slugOwner && slugOwner.id !== id) {
        return errorResponse('Slug already in use', 400)
      }
    }

    // Prevent category from being its own parent
    if (parentId !== undefined && parentId === id) {
      return errorResponse('A category cannot be its own parent', 400)
    }

    const data: any = {}
    if (name !== undefined) data.name = name
    if (nameBn !== undefined) data.nameBn = nameBn || existing.name
    if (slug !== undefined) {
      data.slug = slug || (name ? slugify(name) : existing.slug)
    }
    if (image !== undefined) data.image = image || null
    if (icon !== undefined) data.icon = icon || null
    if (parentId !== undefined) data.parentId = parentId || null
    if (isActive !== undefined) data.isActive = !!isActive
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder)

    const category = await db.productCategory.update({
      where: { id },
      data,
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, slug: true } },
      },
    })

    return jsonResponse({ data: category })
  } catch (err: any) {
    console.error('admin/product-categories/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/product-categories/[id] — soft-delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.productCategory.findUnique({ where: { id } })
    if (!existing) return errorResponse('Category not found', 404)

    await db.productCategory.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    return jsonResponse({ message: 'Category deleted' })
  } catch (err: any) {
    console.error('admin/product-categories/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
