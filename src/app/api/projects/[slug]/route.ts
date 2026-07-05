import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { parseJsonField } from '@/lib/admin-api'

/**
 * GET /api/projects/[slug]
 * Public project detail by slug.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const project = await db.project.findFirst({
      where: { slug },
    })

    if (!project) return errorResponse('Project not found', 404)

    const parsed = {
      ...project,
      images: parseJsonField(project.images),
    }
    // Frontend expects `data` to be the project object directly.
    return jsonResponse({ data: parsed })
  } catch (err: any) {
    console.error('public/projects/[slug] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
