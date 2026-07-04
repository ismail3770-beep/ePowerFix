import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'

/**
 * GET /api/admin/newsletter/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const subscriber = await db.newsletter.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
    if (!subscriber) return errorResponse('Subscriber not found', 404)
    return jsonResponse({ data: subscriber })
  } catch (err: any) {
    console.error('admin/newsletter/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/newsletter/[id] — hard delete (per task spec).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.newsletter.findUnique({ where: { id } })
    if (!existing) return errorResponse('Subscriber not found', 404)

    await db.newsletter.delete({ where: { id } })

    return jsonResponse({ message: 'Subscriber deleted' })
  } catch (err: any) {
    console.error('admin/newsletter/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
