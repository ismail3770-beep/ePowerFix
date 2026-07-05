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

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createProjectSchema = z.object({
  title: z.string().min(1),
  titleBn: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().min(1),
  coverImage: z.string().optional(),
  images: z.array(z.any()).optional(),
  client: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).passthrough()

// ─── GET /api/admin/projects ──────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const url = new URL(request.url)
  const { page, limit, skip, search } = getPagination(url)
  const rawStatus = url.searchParams.get('status')
  const status = rawStatus && rawStatus !== 'all' ? rawStatus.toUpperCase() : undefined

  const where: any = { isDeleted: false }
  if (status) where.status = status
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { client: { contains: search } },
      { location: { contains: search } },
    ]
  }

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.project.count({ where }),
  ])

  const data = projects.map((p) => ({
    ...p,
    images: parseJsonField<string>(p.images),
  }))

  return listResponse(data, total, page, limit)
})

// ─── POST /api/admin/projects ─────────────────────────────────────────────────

export const POST = adminRoute(createProjectSchema, async (request, body, user) => {
  const { title, description } = body
  if (!title) return errorResponse('title is required', 400)
  if (!description) return errorResponse('description is required', 400)

  let slug = body.slug || slugify(title)
  const slugExists = await db.project.findUnique({ where: { slug } })
  if (slugExists) slug = `${slug}-${Date.now().toString(36)}`

  const project = await db.project.create({
    data: {
      title,
      titleBn: body.titleBn || null,
      slug,
      description,
      coverImage: body.coverImage || null,
      images: stringifyJsonField(body.images),
      client: body.client || null,
      location: body.location || null,
      status: body.status || 'COMPLETED',
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  })

  return jsonResponse({
    data: { ...project, images: parseJsonField<string>(project.images) },
  }, 201)
})
