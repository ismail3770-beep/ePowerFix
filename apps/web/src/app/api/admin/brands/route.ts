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

const createBrandSchema = z.object({
  name: z.string().min(1),
  nameBn: z.string().optional(),
  slug: z.string().optional(),
  logo: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/brands ────────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const brands = await db.brand.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
  return jsonResponse({ data: brands })
})

// ─── POST /api/admin/brands ───────────────────────────────────────────────────

export const POST = adminRoute(createBrandSchema, async (request, body, user) => {
  const { name, nameBn, slug, logo, country, website, isActive } = body
  if (!name) {return errorResponse('name is required', 400)}

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

  // Invalidate the public brands cache so the new brand shows up.
  await cache.del('brands:all')

  return jsonResponse({ data: brand }, 201)
})
