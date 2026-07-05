import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
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

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateBrandSchema = z.object({
  name: z.string().optional(),
  nameBn: z.string().optional(),
  slug: z.string().optional(),
  logo: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/brands/[id] ───────────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const brand = await db.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
  if (!brand) return errorResponse('Brand not found', 404)
  return jsonResponse({ data: brand })
})

// ─── PUT /api/admin/brands/[id] ───────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const body = await validateBody(request, updateBrandSchema)

  const existing = await db.brand.findUnique({ where: { id } })
  if (!existing) return errorResponse('Brand not found', 404)

  const { name, nameBn, slug, logo, country, website, isActive } = body

  if (slug !== undefined && slug !== existing.slug) {
    const finalSlug = slug || (name ? slugify(name) : existing.slug)
    const slugOwner = await db.brand.findUnique({ where: { slug: finalSlug } })
    if (slugOwner && slugOwner.id !== id) {
      return errorResponse('Slug already in use', 400)
    }
  }

  const data: any = {}
  if (name !== undefined) data.name = name
  if (nameBn !== undefined) data.nameBn = nameBn || null
  if (slug !== undefined) {
    data.slug = slug || (name ? slugify(name) : existing.slug)
  }
  if (logo !== undefined) data.logo = logo || null
  if (country !== undefined) data.country = country || null
  if (website !== undefined) data.website = website || null
  if (isActive !== undefined) data.isActive = !!isActive

  const brand = await db.brand.update({
    where: { id },
    data,
    include: { _count: { select: { products: true } } },
  })

  return jsonResponse({ data: brand })
})

// ─── DELETE /api/admin/brands/[id] ────────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const existing = await db.brand.findUnique({ where: { id } })
  if (!existing) return errorResponse('Brand not found', 404)

  await db.brand.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  })

  return jsonResponse({ message: 'Brand deleted' })
})
