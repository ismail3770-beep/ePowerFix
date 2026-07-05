import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { parseJsonField, getPagination } from '@/lib/admin-api'
import { cache, cacheKeys } from '@/lib/cache'

/**
 * GET /api/blog
 * Public list of published blog posts.
 * Query: limit, page, search, tag
 *
 * Cached for 5 minutes (TTL 300s) keyed on the requested limit.
 */
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip, search } = getPagination(request.url)
    const url = new URL(request.url)
    const tag = url.searchParams.get('tag') || undefined

    const { posts, total } = await cache.getOrSet(
      cacheKeys.blogPosts(limit),
      300,
      async () => {
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
      },
    )

    const parsed = posts.map((p: any) => ({
      ...p,
      tags: parseJsonField(p.tags),
    }))

    return jsonResponse({
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
  } catch (err: any) {
    console.error('public/blog GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
