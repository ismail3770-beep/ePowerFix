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

function mapPost(p: any) {
  if (!p) {return p}
  return {
    ...p,
    tags: parseJsonField(p.tags),
    status: p.isPublished ? 'PUBLISHED' : 'DRAFT',
    imageUrl: p.coverImage,
    featuredImage: p.coverImage,
  }
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updatePostSchema = z.object({
  title: z.string().optional(),
  titleBn: z.string().optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  author: z.string().optional(),
  imageUrl: z.string().optional(),
  featuredImage: z.string().optional(),
  isPublished: z.boolean().optional(),
  status: z.string().optional(),
  tags: z.array(z.any()).optional(),
}).passthrough()

// ─── GET /api/admin/blog/[id] ─────────────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const post = await db.blogPost.findUnique({ where: { id } })
  if (!post) {return errorResponse('Post not found', 404)}
  return jsonResponse({ data: mapPost(post) })
})

// ─── PUT /api/admin/blog/[id] ─────────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updatePostSchema)

  const existing = await db.blogPost.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Post not found', 404)}

  const data: any = {}
  if (body.title !== undefined) {data.title = body.title}
  if (body.titleBn !== undefined) {data.titleBn = body.titleBn || null}
  if (body.content !== undefined) {data.content = body.content}
  if (body.excerpt !== undefined) {data.excerpt = body.excerpt || null}
  if (body.author !== undefined) {data.author = body.author || null}
  if (body.imageUrl !== undefined) {data.coverImage = body.imageUrl || null}
  if (body.featuredImage !== undefined) {data.coverImage = body.featuredImage || null}
  if (body.isPublished !== undefined) {data.isPublished = !!body.isPublished}

  if (body.status !== undefined) {
    data.isPublished = body.status === 'PUBLISHED'
  }

  if (body.tags !== undefined) {
    data.tags = stringifyJsonField(body.tags)
  }

  if (body.slug !== undefined && body.slug !== existing.slug) {
    const finalSlug = body.slug || slugify(body.title || existing.title)
    const owner = await db.blogPost.findUnique({ where: { slug: finalSlug } })
    if (owner && owner.id !== id) {
      return errorResponse('Slug already in use', 400)
    }
    data.slug = finalSlug
  } else if (body.title !== undefined && body.title !== existing.title) {
    let finalSlug = slugify(body.title)
    const owner = await db.blogPost.findUnique({ where: { slug: finalSlug } })
    if (owner && owner.id !== id) {
      finalSlug = `${finalSlug}-${Date.now().toString(36)}`
    }
    data.slug = finalSlug
  }

  const post = await db.blogPost.update({ where: { id }, data })
  return jsonResponse({ data: mapPost(post) })
})

// ─── DELETE /api/admin/blog/[id] ──────────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const existing = await db.blogPost.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Post not found', 404)}

  await db.blogPost.update({
    where: { id },
    data: { isDeleted: true, isPublished: false },
  })

  return jsonResponse({ message: 'Post deleted' })
})
