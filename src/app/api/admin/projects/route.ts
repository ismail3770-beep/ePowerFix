import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
  getPagination,
  listResponse,
  parseJsonField,
  stringifyJsonField,
} from '@/lib/admin-api'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * GET /api/admin/projects
 * List projects with pagination + search. Parses the `images` JSON string
 * into an array on each row.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
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
  } catch (err: any) {
    console.error('admin/projects GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/projects
 * Body: { title, slug?, description, images (array), coverImage?, client?,
 *        location?, status?, isSellable?, price?, salePrice?,
 *        startDate?, endDate?, titleBn? }
 * Auto-generates slug from title. Stringifies images for SQLite.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

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
  } catch (err: any) {
    console.error('admin/projects POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
