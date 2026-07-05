import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'

/**
 * DELETE /api/admin/product-questions/[id] — hard delete (per task spec).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.productQuestion.findUnique({ where: { id } })
    if (!existing) return errorResponse('Question not found', 404)

    await db.productQuestion.delete({ where: { id } })

    return jsonResponse({ message: 'Question deleted' })
  } catch (err: any) {
    console.error('admin/product-questions/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
