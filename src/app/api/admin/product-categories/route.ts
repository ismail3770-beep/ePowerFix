import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'
import { cache } from '@/lib/cache'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string().min(1),
  nameBn: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
}).passthrough()

// ─── GET /api/admin/product-categories ────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const categories = await db.productCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { products: true } },
      parent: { select: { id: true, name: true } },
    },
  })
  return jsonResponse({ data: categories })
})

// ─── POST /api/admin/product-categories ───────────────────────────────────────

export const POST = adminRoute(createCategorySchema, async (request, body, user) => {
  const { name, nameBn, slug, description, image, icon, parentId, isActive, sortOrder } = body
  if (!name) {return errorResponse('name is required', 400)}

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

  // Invalidate the public product-categories cache.
  await cache.del('product-categories:all')

  return jsonResponse({ data: category }, 201)
})
