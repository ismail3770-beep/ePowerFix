import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateBannerSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  link: z.string().optional(),
  type: z.string().optional(),
  position: z.number().int().nullable().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/banners/[id] ──────────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const banner = await db.banner.findUnique({ where: { id } })
  if (!banner) {return errorResponse('Banner not found', 404)}
  return jsonResponse({ data: banner })
})

// ─── PUT /api/admin/banners/[id] ──────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updateBannerSchema)

  const existing = await db.banner.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Banner not found', 404)}

  const data: any = {}
  if (body.title !== undefined) {data.title = body.title}
  if (body.subtitle !== undefined) {data.subtitle = body.subtitle || null}
  if (body.image !== undefined) {data.image = body.image}
  if (body.link !== undefined) {data.link = body.link || null}
  if (body.type !== undefined) {data.type = body.type}
  if (body.position !== undefined && body.position !== null) {
    data.position = Number(body.position)
  }
  if (body.isActive !== undefined) {data.isActive = !!body.isActive}

  const banner = await db.banner.update({ where: { id }, data })
  return jsonResponse({ data: banner })
})

// ─── DELETE /api/admin/banners/[id] ───────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const existing = await db.banner.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Banner not found', 404)}

  await db.banner.delete({ where: { id } })

  return jsonResponse({ message: 'Banner deleted' })
})
