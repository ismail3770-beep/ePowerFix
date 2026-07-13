import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'

function mapProvider(p: any) {
  if (!p) {return p}
  return {
    ...p,
    isActive: p.enabled,
    isDefault: p.sortOrder === 0,
  }
}

/**
 * PATCH /api/admin/ai-providers/[id]/toggle
 * Toggle the provider's `enabled` flag.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  try {
    const { id } = await params
    const existing = await db.aiProvider.findUnique({ where: { id } })
    if (!existing) {return errorResponse('AI provider not found', 404)}

    const provider = await db.aiProvider.update({
      where: { id },
      data: { enabled: !existing.enabled },
    })

    return jsonResponse({ data: mapProvider(provider) })
  } catch (err: any) {
    console.error('admin/ai-providers/[id]/toggle PATCH error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
