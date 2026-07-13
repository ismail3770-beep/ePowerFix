// Blog routes: list published posts + detail by slug
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError } from '../lib/api-handler.js'
import { parseJsonField, getPagination } from '../lib/helpers.js'
import { cache, cacheKeys } from '../lib/cache.js'

const router = Router()

// ─── GET /api/blog ────────────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)
    const tag = query.tag || undefined

    // Skip cache when search, tag, or non-first page is present to avoid cache poisoning
    const hasExtraFilters = !!(search || tag || page > 1)

    const fetchPosts = async () => {
      const where: any = { isPublished: true }
      if (search) {
        where.OR = [
          { title: { contains: search } },
          { titleBn: { contains: search } },
          { excerpt: { contains: search } },
          { content: { contains: search } },
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
      return { posts, total }
    }

    const { posts, total } = hasExtraFilters
      ? await fetchPosts()
      : await cache.getOrSet(cacheKeys.blogPosts(limit), 300, fetchPosts)

    const parsed = posts.map((p: any) => ({
      ...p,
      tags: parseJsonField(p.tags),
    }))

    res.json({
      success: true,
      data: {
        data: parsed,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  })
)

// ─── GET /api/blog/:slug ──────────────────────────────────────────────────────

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params

    const post = await db.blogPost.findFirst({
      where: { slug, isPublished: true },
    })

    if (!post) {
      throw new ApiError('Post not found', 404)
    }

    const parsed = {
      ...post,
      tags: parseJsonField(post.tags),
    }

    res.json({ data: parsed })
  })
)

export default router
