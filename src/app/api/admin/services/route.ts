import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
  getPagination,
  listResponse,
  parseJsonField,
  stringifyJsonField,
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
 * Maps a Service DB row to the response shape expected by the admin frontend.
 * The frontend uses `price`/`duration`/`image`/`featured` while the schema
 * stores `basePrice`/`shortDesc`/`images`(JSON array)/`isFeatured`.
 * We expose both sets of names.
 */
function mapService(s: any) {
  if (!s) return s
  const images = parseJsonField(s.images)
  return {
    ...s,
    images,
    price: s.basePrice,
    duration: s.shortDesc,
    image: images[0] || null,
    featured: s.isFeatured,
  }
}

/**
 * GET /api/admin/services
 * List services with pagination, search, categoryId filter.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { page, limit, skip, search } = getPagination(request.url)
    const url = new URL(request.url)
    const categoryId = url.searchParams.get('categoryId') || undefined
    const isActiveParam = url.searchParams.get('isActive')
    const isActive =
      isActiveParam === null || isActiveParam === undefined
        ? undefined
        : isActiveParam === 'true'

    const where: any = {}
    if (categoryId) where.categoryId = categoryId
    if (isActive !== undefined) where.isActive = isActive
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameBn: { contains: search } },
        { description: { contains: search } },
        { slug: { contains: search } },
      ]
    }

    const [services, total] = await Promise.all([
      db.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      }),
      db.service.count({ where }),
    ])

    return listResponse(services.map(mapService), total, page, limit)
  } catch (err: any) {
    console.error('admin/services GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/services
 * Create a service. Accepts both task-spec names (price, images array,
 * featured) and frontend names (price, image single URL, duration).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const name = body.name
    const description = body.description
    if (!name) return errorResponse('name is required', 400)
    if (!description) return errorResponse('description is required', 400)

    // price -> basePrice (required)
    const basePrice =
      body.price !== undefined
        ? Number(body.price)
        : body.basePrice !== undefined
        ? Number(body.basePrice)
        : null
    if (basePrice === null || Number.isNaN(basePrice)) {
      return errorResponse('price is required', 400)
    }

    // categoryId — schema requires it. If missing, fall back to a default
    // "Uncategorized" service category (created on demand).
    let categoryId = body.categoryId
    if (!categoryId) {
      let defaultCat = await db.serviceCategory.findUnique({
        where: { slug: 'uncategorized' },
      })
      if (!defaultCat) {
        defaultCat = await db.serviceCategory.create({
          data: {
            name: 'Uncategorized',
            nameBn: 'Uncategorized',
            slug: 'uncategorized',
            isActive: true,
          },
        })
      }
      categoryId = defaultCat.id
    } else {
      // Validate the provided categoryId exists.
      const cat = await db.serviceCategory.findUnique({ where: { id: categoryId } })
      if (!cat) return errorResponse('categoryId does not exist', 400)
    }

    // Auto-slug from name; ensure uniqueness.
    let slug = body.slug || slugify(name)
    const slugExists = await db.service.findUnique({ where: { slug } })
    if (slugExists) slug = `${slug}-${Date.now().toString(36)}`

    // images: accept an array (`images`) OR a single URL string (`image`).
    let imagesArr: string[] = []
    if (Array.isArray(body.images)) {
      imagesArr = body.images
    } else if (typeof body.image === 'string' && body.image) {
      imagesArr = [body.image]
    }

    const service = await db.service.create({
      data: {
        name,
        nameBn: body.nameBn || null,
        slug,
        description,
        shortDesc: body.duration !== undefined ? body.duration : body.shortDesc || null,
        basePrice,
        priceUnit: body.priceUnit || 'fixed',
        images: stringifyJsonField(imagesArr),
        features: body.features || null,
        isFeatured: body.featured !== undefined ? !!body.featured : !!body.isFeatured,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
        categoryId,
      },
      include: { category: true },
    })

    return jsonResponse({ data: mapService(service) }, 201)
  } catch (err: any) {
    console.error('admin/services POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
