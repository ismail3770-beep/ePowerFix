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
 * GET /api/admin/brands/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const brand = await db.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
    if (!brand) return errorResponse('Brand not found', 404)
    return jsonResponse({ data: brand })
  } catch (err: any) {
    console.error('admin/brands/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/brands/[id]
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

    const existing = await db.brand.findUnique({ where: { id } })
    if (!existing) return errorResponse('Brand not found', 404)

    const { name, nameBn, slug, logo, country, website, isActive } = body

    if (slug !== undefined && slug !== existing.slug) {
      const finalSlug = slug || (name ? slugify(name) : existing.slug)
      const slugOwner = await db.brand.findUnique({ where: { slug: finalSlug } })
      if (slugOwner && slugOwner.id !== id) {
        return errorResponse('Slug already in use', 400)
      }
    }

    const data: any = {}
    if (name !== undefined) data.name = name
    if (nameBn !== undefined) data.nameBn = nameBn || null
    if (slug !== undefined) {
      data.slug = slug || (name ? slugify(name) : existing.slug)
    }
    if (logo !== undefined) data.logo = logo || null
    if (country !== undefined) data.country = country || null
    if (website !== undefined) data.website = website || null
    if (isActive !== undefined) data.isActive = !!isActive

    const brand = await db.brand.update({
      where: { id },
      data,
      include: { _count: { select: { products: true } } },
    })

    return jsonResponse({ data: brand })
  } catch (err: any) {
    console.error('admin/brands/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/brands/[id] — soft-delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.brand.findUnique({ where: { id } })
    if (!existing) return errorResponse('Brand not found', 404)

    await db.brand.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    return jsonResponse({ message: 'Brand deleted' })
  } catch (err: any) {
    console.error('admin/brands/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
