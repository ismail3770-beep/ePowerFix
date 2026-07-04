import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
  stringifyJsonField,
} from '@/lib/admin-api'

function mapProvider(p: any) {
  if (!p) return p
  return {
    ...p,
    isActive: p.enabled,
    isDefault: p.sortOrder === 0,
    config: p.config ? safeParse(p.config) : {},
  }
}

function safeParse(s: string): any {
  try {
    return JSON.parse(s)
  } catch {
    return {}
  }
}

/**
 * GET /api/admin/ai-providers/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const provider = await db.aiProvider.findUnique({ where: { id } })
    if (!provider) return errorResponse('AI provider not found', 404)
    return jsonResponse({ data: mapProvider(provider) })
  } catch (err: any) {
    console.error('admin/ai-providers/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/ai-providers/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const existing = await db.aiProvider.findUnique({ where: { id } })
    if (!existing) return errorResponse('AI provider not found', 404)

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.type !== undefined) data.type = (body.type || '').toString().toUpperCase()
    if (body.apiKey !== undefined) data.apiKey = body.apiKey || null
    if (body.baseUrl !== undefined) data.baseUrl = body.baseUrl
    if (body.defaultModel !== undefined) data.defaultModel = body.defaultModel
    if (body.model !== undefined) data.defaultModel = body.model
    if (body.isActive !== undefined) data.enabled = !!body.isActive
    if (body.sortOrder !== undefined && body.sortOrder !== null) {
      data.sortOrder = Number(body.sortOrder)
    }
    if (body.config !== undefined) {
      data.config =
        typeof body.config === 'object'
          ? stringifyJsonField(body.config)
          : String(body.config)
    }

    const provider = await db.aiProvider.update({ where: { id }, data })
    return jsonResponse({ data: mapProvider(provider) })
  } catch (err: any) {
    console.error('admin/ai-providers/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/ai-providers/[id] — hard delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.aiProvider.findUnique({ where: { id } })
    if (!existing) return errorResponse('AI provider not found', 404)

    await db.aiProvider.delete({ where: { id } })

    return jsonResponse({ message: 'AI provider deleted' })
  } catch (err: any) {
    console.error('admin/ai-providers/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
