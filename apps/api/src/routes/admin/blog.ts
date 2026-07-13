// Admin blog routes: list, create, get, update, delete.
// Migrated from apps/web/src/app/api/admin/blog/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/blog

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  parseJsonField,
  stringifyJsonField,
  getPagination,
  listResponse,
} from '../../lib/helpers.js'
import { getAuthUser } from '../../lib/auth.js'

const router = Router()

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

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

const createPostSchema = z
  .object({
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
  })
  .passthrough()

const updatePostSchema = z
  .object({
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
  })
  .passthrough()

// ─── GET /api/admin/blog ─────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)
    const status = query.status || undefined

    const where: any = {}
    if (status) {
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

    res.json(listResponse(posts.map(mapPost), total, page, limit))
  })
)

// ─── POST /api/admin/blog ────────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createPostSchema)
    const authUser = getAuthUser(req)

    const title = body.title
    const content = body.content
    if (!title) {
      throw new ApiError('title is required', 400)
    }
    if (!content) {
      throw new ApiError('content is required', 400)
    }

    let slug = body.slug || slugify(title)
    const slugExists = await db.blogPost.findUnique({ where: { slug } })
    if (slugExists) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    const status = body.status || 'DRAFT'
    const isPublished = status === 'PUBLISHED'
    const coverImage = body.imageUrl || body.featuredImage || null
    const author = body.author || authUser.name || null
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

    res.status(201).json({ data: mapPost(post) })
  })
)

// ─── GET /api/admin/blog/:id ─────────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const post = await db.blogPost.findUnique({ where: { id } })
    if (!post) {
      throw new ApiError('Post not found', 404)
    }
    res.json({ data: mapPost(post) })
  })
)

// ─── PUT /api/admin/blog/:id ─────────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updatePostSchema)

    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Post not found', 404)
    }

    const data: any = {}
    if (body.title !== undefined) data.title = body.title
    if (body.titleBn !== undefined) data.titleBn = body.titleBn || null
    if (body.content !== undefined) data.content = body.content
    if (body.excerpt !== undefined) data.excerpt = body.excerpt || null
    if (body.author !== undefined) data.author = body.author || null
    if (body.imageUrl !== undefined) data.coverImage = body.imageUrl || null
    if (body.featuredImage !== undefined) data.coverImage = body.featuredImage || null
    if (body.isPublished !== undefined) data.isPublished = !!body.isPublished
    if (body.status !== undefined) data.isPublished = body.status === 'PUBLISHED'
    if (body.tags !== undefined) data.tags = stringifyJsonField(body.tags)

    if (body.slug !== undefined && body.slug !== existing.slug) {
      const finalSlug = body.slug || slugify(body.title || existing.title)
      const owner = await db.blogPost.findUnique({ where: { slug: finalSlug } })
      if (owner && owner.id !== id) {
        throw new ApiError('Slug already in use', 400)
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
    res.json({ data: mapPost(post) })
  })
)

// ─── DELETE /api/admin/blog/:id ──────────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Post not found', 404)
    }

    await db.blogPost.update({
      where: { id },
      data: { isDeleted: true, isPublished: false },
    })

    res.json({ message: 'Post deleted' })
  })
)

export default router
