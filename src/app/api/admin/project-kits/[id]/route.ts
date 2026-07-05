import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { parseJsonField, stringifyJsonField } from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'
import { cache } from '@/lib/cache'

// ─── Zod Schema for PUT (partial) ─────────────────────────────────────────────

const updateKitSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  titleBn: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().min(1).max(10000).optional(),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  category: z.string().max(100).optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  price: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET ──────────────────────────────────────────────────────────────────────

export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const kit = await db.projectKit.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, price: true, salePrice: true, stock: true, images: true, sku: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!kit) return errorResponse('Kit not found', 404)

  return jsonResponse({ data: { ...kit, images: parseJsonField(kit.images) } })
})

// ─── PUT ──────────────────────────────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const body = await validateBody(request, updateKitSchema)

  const existing = await db.projectKit.findUnique({ where: { id } })
  if (!existing) return errorResponse('Kit not found', 404)

  const data: any = {}
  if (body.title !== undefined) data.title = body.title
  if (body.titleBn !== undefined) data.titleBn = body.titleBn || null
  if (body.slug !== undefined) {
    const dupe = await db.projectKit.findFirst({ where: { slug: body.slug, NOT: { id } } })
    if (dupe) return errorResponse('Slug already in use', 400)
    data.slug = body.slug
  }
  if (body.description !== undefined) data.description = body.description
  if (body.coverImage !== undefined) data.coverImage = body.coverImage || null
  if (body.images !== undefined) data.images = stringifyJsonField(body.images)
  if (body.category !== undefined) data.category = body.category || null
  if (body.difficulty !== undefined) data.difficulty = body.difficulty || null
  if (body.price !== undefined) data.price = Number(body.price)
  if (body.salePrice !== undefined) data.salePrice = body.salePrice !== null ? Number(body.salePrice) : null
  if (body.stock !== undefined) data.stock = Number(body.stock)
  if (body.isActive !== undefined) data.isActive = !!body.isActive

  const kit = await db.projectKit.update({ where: { id }, data })

  // Invalidate the public project-kits cache so the updated kit shows up.
  await cache.del('project-kits:active')

  return jsonResponse({ data: { ...kit, images: parseJsonField(kit.images) } })
})

// ─── DELETE ───────────────────────────────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const existing = await db.projectKit.findUnique({ where: { id } })
  if (!existing) return errorResponse('Kit not found', 404)

  await db.projectKit.delete({ where: { id } })

  // Invalidate the public project-kits cache so the deleted kit is removed.
  await cache.del('project-kits:active')

  return jsonResponse({ message: 'Kit deleted' })
})
