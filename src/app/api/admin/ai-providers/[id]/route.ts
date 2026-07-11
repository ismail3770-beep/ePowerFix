import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  stringifyJsonField,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

function mapProvider(p: any) {
  if (!p) {return p}
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

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateProviderSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  defaultModel: z.string().optional(),
  model: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().nullable().optional(),
  config: z.any().optional(),
}).passthrough()

// ─── GET /api/admin/ai-providers/[id] ─────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const provider = await db.aiProvider.findUnique({ where: { id } })
  if (!provider) {return errorResponse('AI provider not found', 404)}
  return jsonResponse({ data: mapProvider(provider) })
})

// ─── PUT /api/admin/ai-providers/[id] ─────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updateProviderSchema)

  const existing = await db.aiProvider.findUnique({ where: { id } })
  if (!existing) {return errorResponse('AI provider not found', 404)}

  const data: any = {}
  if (body.name !== undefined) {data.name = body.name}
  if (body.type !== undefined) {data.type = (body.type || '').toString().toUpperCase()}
  if (body.apiKey !== undefined) {data.apiKey = body.apiKey || null}
  if (body.baseUrl !== undefined) {data.baseUrl = body.baseUrl}
  if (body.defaultModel !== undefined) {data.defaultModel = body.defaultModel}
  if (body.model !== undefined) {data.defaultModel = body.model}
  if (body.isActive !== undefined) {data.enabled = !!body.isActive}
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
})

// ─── DELETE /api/admin/ai-providers/[id] ──────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const existing = await db.aiProvider.findUnique({ where: { id } })
  if (!existing) {return errorResponse('AI provider not found', 404)}

  await db.aiProvider.delete({ where: { id } })

  return jsonResponse({ message: 'AI provider deleted' })
})
