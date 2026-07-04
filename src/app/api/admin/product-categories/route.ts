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
 * GET /api/admin/product-categories
 * Returns all categories (no pagination) with product counts.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const categories = await db.productCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
        parent: { select: { id: true, name: true } },
      },
    })
    return jsonResponse({ data: categories })
  } catch (err: any) {
    console.error('admin/product-categories GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/product-categories
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const { name, nameBn, slug, description, image, icon, parentId, isActive, sortOrder } = body
    if (!name) return errorResponse('name is required', 400)

    // Auto-generate slug from name if not provided; ensure uniqueness.
    let finalSlug = slug || slugify(name)
    const slugExists = await db.productCategory.findUnique({
      where: { slug: finalSlug },
    })
    if (slugExists) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`
    }

    // NOTE: nameBn is non-nullable in the schema; default to name if absent.
    const category = await db.productCategory.create({
      data: {
        name,
        nameBn: nameBn || name,
        slug: finalSlug,
        image: image || null,
        icon: icon || null,
        parentId: parentId || null,
        isActive: isActive !== undefined ? !!isActive : true,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
        // description field doesn't exist on ProductCategory model; ignore.
      },
      include: { _count: { select: { products: true } } },
    })

    return jsonResponse({ data: category }, 201)
  } catch (err: any) {
    console.error('admin/product-categories POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
