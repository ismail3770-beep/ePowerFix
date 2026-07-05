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

/**
 * Maps a BlogPost DB row to the response shape expected by the admin frontend.
 * The frontend uses `status` ('DRAFT'|'PUBLISHED'), `imageUrl`, and `tags`
 * (array) while the schema stores `isPublished` (Boolean), `coverImage`, and
 * `tags` (JSON string). We expose both sets of names.
 *
 * NOTE: The schema's BlogPost model has NO `author` relation — `author` is a
 * plain String field. We therefore expose `author` as a string and skip the
 * task-spec "include author (name, email)" relation include.
 */
function mapPost(p: any) {
  if (!p) return p
  return {
    ...p,
    tags: parseJsonField(p.tags),
    status: p.isPublished ? 'PUBLISHED' : 'DRAFT',
    imageUrl: p.coverImage,
    featuredImage: p.coverImage,
  }
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createPostSchema = z.object({
  title: z.string().min(1),
  titleBn: z.string().optional(),
  slug: z.string().optional(),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  imageUrl: z.string().optional(),
  featuredImage: z.string().optional(),
  author: z.string().optional(),
  tags: z.array(z.any()).optional(),
  status: z.string().optional(),
  isPublished: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/blog ──────────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const { page, limit, skip, search } = getPagination(request.url)
  const url = new URL(request.url)
  const status = url.searchParams.get('status') || undefined

  const where: any = {}
  if (status) {
    // Map frontend status string to schema boolean.
    where.isPublished = status === 'PUBLISHED'
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { slug: { contains: search } },
      { content: { contains: search } },
      { author: { contains: search } },
    ]
  }

  const [posts, total] = await Promise.all([
    db.blogPost.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.blogPost.count({ where }),
  ])

  return listResponse(posts.map(mapPost), total, page, limit)
})

// ─── POST /api/admin/blog ─────────────────────────────────────────────────────

export const POST = adminRoute(createPostSchema, async (request, body, user) => {
  const title = body.title
  const content = body.content
  if (!title) return errorResponse('title is required', 400)
  if (!content) return errorResponse('content is required', 400)

  // Auto-slug; ensure uniqueness.
  let slug = body.slug || slugify(title)
  const slugExists = await db.blogPost.findUnique({ where: { slug } })
  if (slugExists) slug = `${slug}-${Date.now().toString(36)}`

  // status -> isPublished
  const status = body.status || 'DRAFT'
  const isPublished = status === 'PUBLISHED'

  // coverImage from imageUrl OR featuredImage
  const coverImage = body.imageUrl || body.featuredImage || null

  // author: prefer body.author, fall back to admin's name.
  const author = body.author || user.name || null

  // tags: array -> JSON string
  const tags = Array.isArray(body.tags) ? body.tags : []

  const post = await db.blogPost.create({
    data: {
      title,
      titleBn: body.titleBn || null,
      slug,
      content,
      excerpt: body.excerpt || null,
      coverImage,
      author,
      tags: stringifyJsonField(tags),
      isPublished,
    },
  })

  return jsonResponse({ data: mapPost(post) }, 201)
})
