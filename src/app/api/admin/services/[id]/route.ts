import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseJsonField,
  stringifyJsonField,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

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

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateServiceSchema = z.object({
  name: z.string().optional(),
  nameBn: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDesc: z.string().optional(),
  duration: z.string().optional(),
  priceUnit: z.string().optional(),
  features: z.string().optional(),
  price: z.number().nullable().optional(),
  basePrice: z.number().nullable().optional(),
  isFeatured: z.boolean().optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  categoryId: z.string().optional(),
  images: z.array(z.any()).optional(),
  image: z.string().optional(),
}).passthrough()

// ─── GET /api/admin/services/[id] ─────────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const service = await db.service.findUnique({
    where: { id },
    include: { category: true },
  })
  if (!service) return errorResponse('Service not found', 404)
  return jsonResponse({ data: mapService(service) })
})

// ─── PUT /api/admin/services/[id] ─────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const body = await validateBody(request, updateServiceSchema)

  const existing = await db.service.findUnique({ where: { id } })
  if (!existing) return errorResponse('Service not found', 404)

  const data: any = {}

  if (body.name !== undefined) data.name = body.name
  if (body.nameBn !== undefined) data.nameBn = body.nameBn || null
  if (body.description !== undefined) data.description = body.description
  if (body.shortDesc !== undefined) data.shortDesc = body.shortDesc || null
  if (body.duration !== undefined) data.shortDesc = body.duration || null
  if (body.priceUnit !== undefined) data.priceUnit = body.priceUnit
  if (body.features !== undefined) data.features = body.features || null

  if (body.price !== undefined) data.basePrice = Number(body.price)
  if (body.basePrice !== undefined) data.basePrice = Number(body.basePrice)

  if (body.isFeatured !== undefined) data.isFeatured = !!body.isFeatured
  if (body.featured !== undefined) data.isFeatured = !!body.featured
  if (body.isActive !== undefined) data.isActive = !!body.isActive

  if (body.categoryId !== undefined && body.categoryId) {
    const cat = await db.serviceCategory.findUnique({
      where: { id: body.categoryId },
    })
    if (!cat) return errorResponse('categoryId does not exist', 400)
    data.categoryId = body.categoryId
  }

  // images: accept array or single URL string.
  if (body.images !== undefined) {
    data.images = stringifyJsonField(body.images)
  } else if (body.image !== undefined) {
    const arr =
      typeof body.image === 'string' && body.image ? [body.image] : []
    data.images = stringifyJsonField(arr)
  }

  // slug
  if (body.slug !== undefined && body.slug !== existing.slug) {
    const finalSlug = body.slug || slugify(body.name || existing.name)
    const owner = await db.service.findUnique({ where: { slug: finalSlug } })
    if (owner && owner.id !== id) {
      return errorResponse('Slug already in use', 400)
    }
    data.slug = finalSlug
  } else if (body.name !== undefined && body.name !== existing.name) {
    // Regenerate slug from new name if slug not explicitly provided.
    let finalSlug = slugify(body.name)
    const owner = await db.service.findUnique({ where: { slug: finalSlug } })
    if (owner && owner.id !== id) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`
    }
    data.slug = finalSlug
  }

  const service = await db.service.update({
    where: { id },
    data,
    include: { category: true },
  })

  return jsonResponse({ data: mapService(service) })
})

// ─── DELETE /api/admin/services/[id] ──────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const existing = await db.service.findUnique({ where: { id } })
  if (!existing) return errorResponse('Service not found', 404)

  await db.service.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  })

  return jsonResponse({ message: 'Service deleted' })
})
