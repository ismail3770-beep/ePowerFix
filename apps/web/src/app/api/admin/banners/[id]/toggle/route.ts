import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'

/**
 * PATCH /api/admin/banners/[id]/toggle
 * Toggle the banner's isActive flag.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  try {
    const { id } = await params
    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) {return errorResponse('Banner not found', 404)}

    const banner = await db.banner.update({
      where: { id },
      data: { isActive: !existing.isActive },
    })

    return jsonResponse({ data: banner })
  } catch (err: any) {
    console.error('admin/banners/[id]/toggle PATCH error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
