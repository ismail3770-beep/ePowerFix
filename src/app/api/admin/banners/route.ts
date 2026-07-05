import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createBannerSchema = z.object({
  title: z.string().min(1),
  image: z.string().min(1),
  link: z.string().optional(),
  subtitle: z.string().optional(),
  type: z.string().optional(),
  position: z.number().int().optional(),
  isActive: z.boolean().optional(),
}).passthrough()

// ─── GET /api/admin/banners ───────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const banners = await db.banner.findMany({
    orderBy: { position: 'asc' },
  })
  return jsonResponse({ data: banners })
})

// ─── POST /api/admin/banners ──────────────────────────────────────────────────

export const POST = adminRoute(createBannerSchema, async (request, body, user) => {
  const title = (body.title || '').toString().trim()
  if (!title) return errorResponse('title is required', 400)

  const image = (body.image || '').toString().trim()
  if (!image) return errorResponse('image is required', 400)

  const banner = await db.banner.create({
    data: {
      title,
      subtitle: body.subtitle || null,
      image,
      link: body.link || null,
      type: body.type || 'hero',
      position:
        body.position !== undefined && body.position !== null
          ? Number(body.position)
          : 0,
      isActive: body.isActive !== undefined ? !!body.isActive : true,
    },
  })

  return jsonResponse({ data: banner }, 201)
})
