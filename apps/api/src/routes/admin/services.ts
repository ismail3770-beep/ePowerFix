// Admin service + service-category routes.
// Migrated from:
//   apps/web/src/app/api/admin/services/route.ts and [id]/route.ts
//   apps/web/src/app/api/admin/service-categories/route.ts and [id]/route.ts
//
// Mounted at /api/admin/services  (list, create, :id, :id/...)
// Mounted at /api/admin/service-categories  (mounted separately via index.ts)

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  parseJsonField,
  stringifyJsonField,
  getPagination,
  listResponse,
} from '../../lib/helpers.js'

const router = Router()

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
 * Exposes both schema field names and convenience aliases.
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

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const createServiceSchema = z
  .object({
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
  })
  .passthrough()

const updateServiceSchema = z
  .object({
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
  })
  .passthrough()

// ─── GET /api/admin/services ─────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)
    const categoryId = query.categoryId || undefined
    const isActiveParam = query.isActive
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

    res.json(listResponse(services.map(mapService), total, page, limit))
  })
)

// ─── POST /api/admin/services ────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createServiceSchema)

    const name = body.name
    const description = body.description
    if (!name) {
      throw new ApiError('name is required', 400)
    }
    if (!description) {
      throw new ApiError('description is required', 400)
    }

    const basePrice =
      body.price !== undefined
        ? Number(body.price)
        : body.basePrice !== undefined
        ? Number(body.basePrice)
        : null
    if (basePrice === null || Number.isNaN(basePrice)) {
      throw new ApiError('price is required', 400)
    }

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
      const cat = await db.serviceCategory.findUnique({ where: { id: categoryId } })
      if (!cat) {
        throw new ApiError('categoryId does not exist', 400)
      }
    }

    let slug = body.slug || slugify(name)
    const slugExists = await db.service.findUnique({ where: { slug } })
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

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
        shortDesc:
          body.duration !== undefined ? body.duration : body.shortDesc || null,
        basePrice,
        priceUnit: body.priceUnit || 'fixed',
        images: stringifyJsonField(imagesArr),
        features: body.features || null,
        isFeatured:
          body.featured !== undefined ? !!body.featured : !!body.isFeatured,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
        categoryId,
      },
      include: { category: true },
    })

    res.status(201).json({ data: mapService(service) })
  })
)

// ─── GET /api/admin/services/:id ─────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const service = await db.service.findUnique({
      where: { id },
      include: { category: true },
    })
    if (!service) {
      throw new ApiError('Service not found', 404)
    }
    res.json({ data: mapService(service) })
  })
)

// ─── PUT /api/admin/services/:id ─────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateServiceSchema)

    const existing = await db.service.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Service not found', 404)
    }

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
      if (!cat) {
        throw new ApiError('categoryId does not exist', 400)
      }
      data.categoryId = body.categoryId
    }

    if (body.images !== undefined) {
      data.images = stringifyJsonField(body.images)
    } else if (body.image !== undefined) {
      const arr =
        typeof body.image === 'string' && body.image ? [body.image] : []
      data.images = stringifyJsonField(arr)
    }

    if (body.slug !== undefined && body.slug !== existing.slug) {
      const finalSlug = body.slug || slugify(body.name || existing.name)
      const owner = await db.service.findUnique({ where: { slug: finalSlug } })
      if (owner && owner.id !== id) {
        throw new ApiError('Slug already in use', 400)
      }
      data.slug = finalSlug
    } else if (body.name !== undefined && body.name !== existing.name) {
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

    res.json({ data: mapService(service) })
  })
)

// ─── DELETE /api/admin/services/:id ──────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.service.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Service not found', 404)
    }

    await db.service.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    res.json({ message: 'Service deleted' })
  })
)

// ─── Service Categories (mounted at /api/admin/service-categories) ────────────

export const serviceCategoriesRouter = Router()

const createServiceCategorySchema = z
  .object({
    name: z.string().min(1),
    nameBn: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    image: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .passthrough()

const updateServiceCategorySchema = z
  .object({
    name: z.string().optional(),
    nameBn: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    image: z.string().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

serviceCategoriesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await db.serviceCategory.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { services: true } },
      },
    })
    res.json({ data: categories })
  })
)

serviceCategoriesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createServiceCategorySchema)
    const name = body.name
    if (!name) {
      throw new ApiError('name is required', 400)
    }

    let slug = body.slug || slugify(name)
    const slugExists = await db.serviceCategory.findUnique({ where: { slug } })
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

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

    res.status(201).json({ data: category })
  })
)

serviceCategoriesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const category = await db.serviceCategory.findUnique({
      where: { id },
      include: { _count: { select: { services: true } } },
    })
    if (!category) {
      throw new ApiError('Category not found', 404)
    }
    res.json({ data: category })
  })
)

serviceCategoriesRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateServiceCategorySchema)

    const existing = await db.serviceCategory.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Category not found', 404)
    }

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
        throw new ApiError('Slug already in use', 400)
      }
      data.slug = finalSlug
    }

    const category = await db.serviceCategory.update({
      where: { id },
      data,
      include: { _count: { select: { services: true } } },
    })

    res.json({ data: category })
  })
)

serviceCategoriesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.serviceCategory.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Category not found', 404)
    }

    await db.serviceCategory.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    res.json({ message: 'Category deleted' })
  })
)

export default router
