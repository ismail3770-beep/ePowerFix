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
 * GET /api/admin/brands
 * Returns brands as a plain array inside `data`.
 * (Frontend reads `res.data` array OR `res.data.data`.)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const brands = await db.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    })
    return jsonResponse({ data: brands })
  } catch (err: any) {
    console.error('admin/brands GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/brands
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const { name, nameBn, slug, logo, country, website, isActive } = body
    if (!name) return errorResponse('name is required', 400)

    let finalSlug = slug || slugify(name)
    const slugExists = await db.brand.findUnique({ where: { slug: finalSlug } })
    if (slugExists) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`
    }

    const brand = await db.brand.create({
      data: {
        name,
        nameBn: nameBn || null,
        slug: finalSlug,
        logo: logo || null,
        country: country || null,
        website: website || null,
        isActive: isActive !== undefined ? !!isActive : true,
      },
      include: { _count: { select: { products: true } } },
    })

    return jsonResponse({ data: brand }, 201)
  } catch (err: any) {
    console.error('admin/brands POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
