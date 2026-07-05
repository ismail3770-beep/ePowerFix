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

/**
 * GET /api/admin/blog
 * List blog posts with pagination, search, status filter.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
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
  } catch (err: any) {
    console.error('admin/blog GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/blog
 * Create a post. `author` is set from the body, or falls back to the current
 * admin's name. `status` ('PUBLISHED'|'PENDING'|'DRAFT') maps to
 * `isPublished`. `imageUrl`/`featuredImage` map to `coverImage`. `tags`
 * array is JSON-stringified.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

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
    const author = body.author || auth.user!.name || null

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
  } catch (err: any) {
    console.error('admin/blog POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
