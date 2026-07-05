import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { parseJsonField } from '@/lib/admin-api'

/**
 * GET /api/projects
 * Public list of projects (portfolio + sellable kits).
 * Query: search, sellable (true = only sellable kits)
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || ''
    const sellableOnly = url.searchParams.get('sellable') === 'true'

    const where: any = {}
    if (sellableOnly) where.isSellable = true
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleBn: { contains: search } },
        { description: { contains: search } },
        { client: { contains: search } },
        { location: { contains: search } },
      ]
    }

    const projects = await db.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    const parsed = projects.map((p: any) => ({
      ...p,
      images: parseJsonField(p.images),
    }))

    return jsonResponse({ data: parsed })
  } catch (err: any) {
    console.error('public/projects GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
