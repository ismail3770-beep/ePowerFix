// Admin contact-message routes: list, get, update, delete.
// Migrated from apps/web/src/app/api/admin/messages/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/messages

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  getPagination,
  listResponse,
} from '../../lib/helpers.js'

const router = Router()

function mapMessage(m: any) {
  if (!m) return m
  return {
    ...m,
    isRead: m.status !== 'NEW',
  }
}

const updateMessageSchema = z
  .object({
    status: z.string().optional(),
    isRead: z.boolean().optional(),
    adminReply: z.string().optional(),
  })
  .passthrough()

// ─── GET /api/admin/messages ─────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const { page, limit, skip, search } = getPagination(query)
    const rawStatus = query.status
    const status =
      rawStatus && rawStatus !== 'all' ? String(rawStatus).toUpperCase() : undefined

    const where: any = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { subject: { contains: search } },
        { message: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [messages, total] = await Promise.all([
      db.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.contact.count({ where }),
    ])

    res.json(listResponse(messages.map(mapMessage), total, page, limit))
  })
)

// ─── GET /api/admin/messages/:id ─────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const message = await db.contact.findUnique({ where: { id } })
    if (!message) {
      throw new ApiError('Message not found', 404)
    }
    res.json({ data: mapMessage(message) })
  })
)

// ─── PUT /api/admin/messages/:id ─────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateMessageSchema)

    const existing = await db.contact.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Message not found', 404)
    }

    const data: any = {}
    if (body.status !== undefined) {
      const allowed = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
      if (!allowed.includes(body.status)) {
        throw new ApiError(`status must be one of ${allowed.join(', ')}`, 400)
      }
      data.status = body.status
    } else if (body.isRead !== undefined) {
      data.status = body.isRead ? 'RESOLVED' : 'NEW'
    }
    // adminReply is not a schema field; ignored.

    const message = await db.contact.update({ where: { id }, data })
    res.json({ data: mapMessage(message) })
  })
)

// ─── DELETE /api/admin/messages/:id ──────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.contact.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Message not found', 404)
    }

    await db.contact.delete({ where: { id } })
    res.json({ message: 'Message deleted' })
  })
)

export default router
