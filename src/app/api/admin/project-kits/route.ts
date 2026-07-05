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

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const createKitSchema = z.object({
  title: z.string().min(1).max(200),
  titleBn: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().min(1).max(10000),
  coverImage: z.string().optional(),
  images: z.array(z.string()).optional().default([]),
  category: z.string().max(100).optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  price: z.number().min(0),
  salePrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
})

// ─── GET: List project kits ──────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const { page, limit, skip, search } = getPagination(request.url)

  const where: any = {}
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { titleBn: { contains: search } },
      { description: { contains: search } },
      { category: { contains: search } },
    ]
  }

  const [kits, total] = await Promise.all([
    db.projectKit.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { items: true } } },
    }),
    db.projectKit.count({ where }),
  ])

  const parsed = kits.map((k: any) => ({
    ...k,
    images: parseJsonField(k.images),
    itemCount: k._count?.items ?? 0,
    _count: undefined,
  }))

  return listResponse(parsed, total, page, limit)
})

// ─── POST: Create project kit ────────────────────────────────────────────────

export const POST = adminRoute(createKitSchema, async (request, body, user) => {
  const { title, titleBn, slug, description, coverImage, images, category, difficulty, price, salePrice, stock, isActive } = body

  let finalSlug = slug || slugify(title)
  const existing = await db.projectKit.findUnique({ where: { slug: finalSlug } })
  if (existing) {
    finalSlug = `${finalSlug}-${Date.now().toString(36)}`
  }

  const kit = await db.projectKit.create({
    data: {
      title,
      titleBn: titleBn || null,
      slug: finalSlug,
      description,
      coverImage: coverImage || null,
      images: stringifyJsonField(images),
      category: category || null,
      difficulty: difficulty || null,
      price: Number(price),
      salePrice: salePrice !== undefined ? Number(salePrice) : null,
      stock: Number(stock),
      isActive: !!isActive,
    },
  })

  return jsonResponse({
    data: { ...kit, images: parseJsonField(kit.images) },
  }, 201)
})
