import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

function mapMessage(m: any) {
  if (!m) return m
  return {
    ...m,
    isRead: m.status !== 'NEW',
  }
}

/**
 * GET /api/admin/messages/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const message = await db.contact.findUnique({ where: { id } })
    if (!message) return errorResponse('Message not found', 404)
    return jsonResponse({ data: mapMessage(message) })
  } catch (err: any) {
    console.error('admin/messages/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/messages/[id]
 * Accepts EITHER `isRead` (boolean — mapped to status 'NEW'/'RESOLVED') OR
 * `status` ('NEW'|'IN_PROGRESS'|'RESOLVED'|'CLOSED') directly. The schema has
 * no `adminReply` column, so that field is silently ignored if sent.
 *
 * Side-effect: when a message is first viewed via a status change away from
 * 'NEW', it is treated as "read".
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

    const existing = await db.contact.findUnique({ where: { id } })
    if (!existing) return errorResponse('Message not found', 404)

    const data: any = {}

    if (body.status !== undefined) {
      const allowed = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
      if (!allowed.includes(body.status)) {
        return errorResponse(`status must be one of ${allowed.join(', ')}`, 400)
      }
      data.status = body.status
    } else if (body.isRead !== undefined) {
      // Map boolean isRead to a status string. true -> RESOLVED, false -> NEW.
      data.status = body.isRead ? 'RESOLVED' : 'NEW'
    }

    // adminReply is not a schema field; ignored.

    const message = await db.contact.update({ where: { id }, data })
    return jsonResponse({ data: mapMessage(message) })
  } catch (err: any) {
    console.error('admin/messages/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/messages/[id] — hard delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.contact.findUnique({ where: { id } })
    if (!existing) return errorResponse('Message not found', 404)

    await db.contact.delete({ where: { id } })

    return jsonResponse({ message: 'Message deleted' })
  } catch (err: any) {
    console.error('admin/messages/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
