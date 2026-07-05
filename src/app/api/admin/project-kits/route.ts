import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
  getPagination,
  listResponse,
} from '@/lib/admin-api'
import { parseJsonField, stringifyJsonField } from '@/lib/admin-api'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * GET /api/admin/project-kits
 * List all project kits with pagination + search.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { page, limit, skip, search } = getPagination(request.url)

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleBn: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ]
    }

    const [kits, total] = await Promise.all([
      db.projectKit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true } },
        },
      }),
      db.projectKit.count({ where }),
    ])

    const parsed = kits.map((k: any) => ({
      ...k,
      images: parseJsonField(k.images),
      itemCount: k._count?.items ?? 0,
      _count: undefined,
    }))

    return listResponse(parsed, total, page, limit)
  } catch (err: any) {
    console.error('admin/project-kits GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/project-kits
 * Create a new project kit.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const { title, titleBn, slug, description, coverImage, images, category, difficulty, price, salePrice, stock, isActive } = body
    if (!title) return errorResponse('title is required', 400)
    if (!description) return errorResponse('description is required', 400)
    if (price === undefined || price === null) return errorResponse('price is required', 400)

    let finalSlug = slug || slugify(title)
    const existing = await db.projectKit.findUnique({ where: { slug: finalSlug } })
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`
    }

    const kit = await db.projectKit.create({
      data: {
        title,
        titleBn: titleBn || null,
        slug: finalSlug,
        description,
        coverImage: coverImage || null,
        images: stringifyJsonField(images),
        category: category || null,
        difficulty: difficulty || null,
        price: Number(price),
        salePrice: salePrice !== undefined ? Number(salePrice) : null,
        stock: stock !== undefined ? Number(stock) : 0,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    })

    return jsonResponse({
      data: {
        ...kit,
        images: parseJsonField(kit.images),
      },
    }, 201)
  } catch (err: any) {
    console.error('admin/project-kits POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
