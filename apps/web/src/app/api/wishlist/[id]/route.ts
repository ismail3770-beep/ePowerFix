import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/auth'

/**
 * DELETE /api/wishlist/[id]
 * Remove an item from the current user's wishlist.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (!auth.ok) {return auth.response!}

    const { id } = await params

    // Ensure the item belongs to the requesting user before deleting.
    const item = await db.wishlist.findUnique({ where: { id } })
    if (!item) {return errorResponse('Wishlist item not found', 404)}
    if (item.userId !== auth.user!.id) {return errorResponse('Forbidden', 403)}

    await db.wishlist.delete({ where: { id } })
    return jsonResponse({ success: true, message: 'Removed from wishlist' })
  } catch (err: any) {
    console.error('public/wishlist/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
