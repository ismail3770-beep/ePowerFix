import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseJsonField,
  stringifyJsonField,
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

const updateProjectSchema = z.object({
  title: z.string().optional(),
  titleBn: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  images: z.array(z.any()).optional(),
  client: z.string().optional(),
  location: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).passthrough()

// ─── GET /api/admin/projects/[id] ─────────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const project = await db.project.findUnique({ where: { id } })
  if (!project || project.isDeleted) {
    return errorResponse('Project not found', 404)
  }
  return jsonResponse({
    data: { ...project, images: parseJsonField<string>(project.images) },
  })
})

// ─── PUT /api/admin/projects/[id] ─────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updateProjectSchema)

  const existing = await db.project.findUnique({ where: { id } })
  if (!existing || existing.isDeleted) {
    return errorResponse('Project not found', 404)
  }

  if (body.slug !== undefined && body.slug !== existing.slug) {
    const finalSlug = body.slug || (body.title ? slugify(body.title) : existing.slug)
    const owner = await db.project.findUnique({ where: { slug: finalSlug } })
    if (owner && owner.id !== id) {
      return errorResponse('Slug already in use', 400)
    }
  }

  const data: any = {}
  if (body.title !== undefined) {data.title = body.title}
  if (body.titleBn !== undefined) {data.titleBn = body.titleBn || null}
  if (body.slug !== undefined) {
    data.slug = body.slug || (body.title ? slugify(body.title) : existing.slug)
  }
  if (body.description !== undefined) {data.description = body.description}
  if (body.coverImage !== undefined) {data.coverImage = body.coverImage || null}
  if (body.images !== undefined) {data.images = stringifyJsonField(body.images)}
  if (body.client !== undefined) {data.client = body.client || null}
  if (body.location !== undefined) {data.location = body.location || null}
  if (body.status !== undefined) {data.status = body.status}
  if (body.startDate !== undefined) {data.startDate = body.startDate ? new Date(body.startDate) : null}
  if (body.endDate !== undefined) {data.endDate = body.endDate ? new Date(body.endDate) : null}

  const project = await db.project.update({ where: { id }, data })

  return jsonResponse({
    data: { ...project, images: parseJsonField<string>(project.images) },
  })
})

// ─── DELETE /api/admin/projects/[id] ──────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const existing = await db.project.findUnique({ where: { id } })
  if (!existing || existing.isDeleted) {
    return errorResponse('Project not found', 404)
  }

  await db.project.update({
    where: { id },
    data: { isDeleted: true },
  })

  return jsonResponse({ message: 'Project deleted' })
})
