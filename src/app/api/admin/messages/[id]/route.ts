import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

function mapMessage(m: any) {
  if (!m) {return m}
  return {
    ...m,
    isRead: m.status !== 'NEW',
  }
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateMessageSchema = z.object({
  status: z.string().optional(),
  isRead: z.boolean().optional(),
  adminReply: z.string().optional(),
}).passthrough()

// ─── GET /api/admin/messages/[id] ─────────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const message = await db.contact.findUnique({ where: { id } })
  if (!message) {return errorResponse('Message not found', 404)}
  return jsonResponse({ data: mapMessage(message) })
})

// ─── PUT /api/admin/messages/[id] ─────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updateMessageSchema)

  const existing = await db.contact.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Message not found', 404)}

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
})

// ─── DELETE /api/admin/messages/[id] ──────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const existing = await db.contact.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Message not found', 404)}

  await db.contact.delete({ where: { id } })

  return jsonResponse({ message: 'Message deleted' })
})
