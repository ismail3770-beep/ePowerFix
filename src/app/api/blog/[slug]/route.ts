import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { parseJsonField } from '@/lib/admin-api'

/**
 * GET /api/blog/[slug]
 * Public blog post detail by slug (published only).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const post = await db.blogPost.findFirst({
      where: { slug, isPublished: true },
    })

    if (!post) return errorResponse('Post not found', 404)

    const parsed = {
      ...post,
      tags: parseJsonField(post.tags),
    }
    return jsonResponse({ data: parsed })
  } catch (err: any) {
    console.error('public/blog/[slug] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
