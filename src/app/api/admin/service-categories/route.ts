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
 * GET /api/admin/service-categories
 * Returns all service categories with `_count` of services.
 * Frontend reads `res.data` array OR `res.data.data`.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const categories = await db.serviceCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { services: true } },
      },
    })
    return jsonResponse({ data: categories })
  } catch (err: any) {
    console.error('admin/service-categories GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/service-categories
 * Body: { name, slug?, description?, icon?, isActive }
 * NOTE: schema requires `nameBn`; default to `name` if absent. `description`
 * is not a schema field and is ignored.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const name = body.name
    if (!name) return errorResponse('name is required', 400)

    let slug = body.slug || slugify(name)
    const slugExists = await db.serviceCategory.findUnique({ where: { slug } })
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`

    const category = await db.serviceCategory.create({
      data: {
        name,
        nameBn: body.nameBn || name,
        slug,
        icon: body.icon || null,
        image: body.image || null,
        sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : 0,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
      include: { _count: { select: { services: true } } },
    })

    return jsonResponse({ data: category }, 201)
  } catch (err: any) {
    console.error('admin/service-categories POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
