import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
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

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createServiceCategorySchema = z.object({
  name: z.string().min(1),
  nameBn: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
}).passthrough()

// ─── GET /api/admin/service-categories ────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const categories = await db.serviceCategory.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { services: true } },
    },
  })
  return jsonResponse({ data: categories })
})

// ─── POST /api/admin/service-categories ───────────────────────────────────────

export const POST = adminRoute(createServiceCategorySchema, async (request, body, user) => {
  const name = body.name
  if (!name) {return errorResponse('name is required', 400)}

  let slug = body.slug || slugify(name)
  const slugExists = await db.serviceCategory.findUnique({ where: { slug } })
  if (slugExists) {slug = `${slug}-${Date.now().toString(36)}`}

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
})
