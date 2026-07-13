// Admin return-request routes: list, get, update, delete.
// Migrated from apps/web/src/app/api/admin/returns/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/returns

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  getPagination,
  listResponse,
} from '../../lib/helpers.js'

const router = Router()

const updateReturnSchema = z
  .object({
    status: z.string().optional(),
    adminNotes: z.string().optional(),
  })
  .passthrough()

// Fire-and-forget notification helper
async function notifyUser(
  userId: string,
  title: string,
  message: string,
  type: string = 'INFO',
  relatedId?: string,
): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        relatedId: relatedId || null,
      },
    })
  } catch {
    // Swallow
  }
}

// ─── GET /api/admin/returns ──────────────────────────────────────────────────

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
        { reason: { contains: search } },
        { order: { orderNumber: { contains: search } } },
      ]
    }

    const [returns, total] = await Promise.all([
      db.returnRequest.findMany({
        where,
        include: {
          order: { select: { orderNumber: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.returnRequest.count({ where }),
    ])

    res.json(listResponse(returns, total, page, limit))
  })
)

// ─── GET /api/admin/returns/:id ──────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const ret = await db.returnRequest.findUnique({
      where: { id },
      include: {
        order: { select: { orderNumber: true } },
        user: { select: { name: true, email: true } },
      },
    })
    if (!ret) {
      throw new ApiError('Return request not found', 404)
    }
    res.json({ data: ret })
  })
)

// ─── PUT /api/admin/returns/:id ──────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateReturnSchema)

    // NOTE: The schema's ReturnRequest model has NO `adminNotes` column.
    // We persist status only and ignore adminNotes to avoid Prisma errors.
    const data: any = {}
    if (body.status) data.status = body.status

    const updated = await db.returnRequest.update({
      where: { id },
      data,
      include: { order: { select: { orderNumber: true } } },
    })

    if (body.status && updated.userId) {
      const statusMessages: Record<string, string> = {
        PENDING: 'is under review',
        APPROVED: 'has been approved',
        REJECTED: 'has been rejected',
        COMPLETED: 'has been completed — refund processed',
      }
      const detail =
        statusMessages[body.status.toUpperCase()] || `updated to ${body.status}`
      await notifyUser(
        updated.userId,
        'Return Request Update',
        `Your return request for order ${updated.order.orderNumber} ${detail}.`,
        'RETURN',
        updated.id,
      )
    }

    res.json({ data: updated })
  })
)

// ─── DELETE /api/admin/returns/:id ───────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    await db.returnRequest.delete({ where: { id } })
    res.json({ message: 'Return request deleted' })
  })
)

export default router
