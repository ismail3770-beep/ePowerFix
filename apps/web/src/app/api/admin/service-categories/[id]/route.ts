import type { NextRequest } from 'next/server'
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

const updateServiceCategorySchema = z.object({
  name: z.string().optional(),
  nameBn: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/service-categories/[id] ───────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const category = await db.serviceCategory.findUnique({
    where: { id },
    include: { _count: { select: { services: true } } },
  })
  if (!category) {return errorResponse('Category not found', 404)}
  return jsonResponse({ data: category })
})

// ─── PUT /api/admin/service-categories/[id] ───────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updateServiceCategorySchema)

  const existing = await db.serviceCategory.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Category not found', 404)}

  const data: any = {}
  if (body.name !== undefined) {data.name = body.name}
  if (body.nameBn !== undefined) {data.nameBn = body.nameBn || existing.name}
  if (body.icon !== undefined) {data.icon = body.icon || null}
  if (body.image !== undefined) {data.image = body.image || null}
  if (body.sortOrder !== undefined) {data.sortOrder = Number(body.sortOrder)}
  if (body.isActive !== undefined) {data.isActive = !!body.isActive}

  if (body.slug !== undefined && body.slug !== existing.slug) {
    const finalSlug = body.slug || slugify(body.name || existing.name)
    const owner = await db.serviceCategory.findUnique({
      where: { slug: finalSlug },
    })
    if (owner && owner.id !== id) {
      return errorResponse('Slug already in use', 400)
    }
    data.slug = finalSlug
  }

  const category = await db.serviceCategory.update({
    where: { id },
    data,
    include: { _count: { select: { services: true } } },
  })

  return jsonResponse({ data: category })
})

// ─── DELETE /api/admin/service-categories/[id] ────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const existing = await db.serviceCategory.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Category not found', 404)}

  await db.serviceCategory.update({
    where: { id },
    data: { isDeleted: true, isActive: false },
  })

  return jsonResponse({ message: 'Category deleted' })
})
