import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  getPagination,
  listResponse,
  parseJsonField,
  stringifyJsonField,
} from '@/lib/admin-api'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'

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
  if (!s) {return s}
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

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createServiceSchema = z.object({
  name: z.string().min(1),
  nameBn: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().min(1),
  shortDesc: z.string().optional(),
  duration: z.string().optional(),
  price: z.number().nullable().optional(),
  basePrice: z.number().nullable().optional(),
  priceUnit: z.string().optional(),
  images: z.array(z.any()).optional(),
  image: z.string().optional(),
  features: z.string().optional(),
  isFeatured: z.boolean().optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().optional(),
}).passthrough()

// ─── GET /api/admin/services ──────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const { page, limit, skip, search } = getPagination(request.url)
  const url = new URL(request.url)
  const categoryId = url.searchParams.get('categoryId') || undefined
  const isActiveParam = url.searchParams.get('isActive')
  const isActive =
    isActiveParam === null || isActiveParam === undefined
      ? undefined
      : isActiveParam === 'true'

  const where: any = {}
  if (categoryId) {where.categoryId = categoryId}
  if (isActive !== undefined) {where.isActive = isActive}
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
})

// ─── POST /api/admin/services ─────────────────────────────────────────────────

export const POST = adminRoute(createServiceSchema, async (request, body, user) => {
  const name = body.name
  const description = body.description
  if (!name) {return errorResponse('name is required', 400)}
  if (!description) {return errorResponse('description is required', 400)}

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
    if (!cat) {return errorResponse('categoryId does not exist', 400)}
  }

  // Auto-slug from name; ensure uniqueness.
  let slug = body.slug || slugify(name)
  const slugExists = await db.service.findUnique({ where: { slug } })
  if (slugExists) {slug = `${slug}-${Date.now().toString(36)}`}

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
})
