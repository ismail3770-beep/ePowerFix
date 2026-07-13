// Admin quote-request routes: list, get, update, delete.
// Migrated from apps/web/src/app/api/admin/quote-requests/route.ts and [id]/route.ts.
//
// Mounted at /api/admin/quote-requests

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  getPagination,
  listResponse,
} from '../../lib/helpers.js'

const router = Router()

function mapQuote(q: any) {
  if (!q) return q
  return {
    ...q,
    message: q.description,
    email: q.email || '',
  }
}

const updateQuoteSchema = z
  .object({
    status: z.string().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    serviceType: z.string().optional(),
    description: z.string().optional(),
    address: z.string().optional(),
    budget: z.string().optional(),
    quotedPrice: z.number().optional(),
    adminNotes: z.string().optional(),
  })
  .passthrough()

// ─── GET /api/admin/quote-requests ───────────────────────────────────────────

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
        { phone: { contains: search } },
        { serviceType: { contains: search } },
        { description: { contains: search } },
        { address: { contains: search } },
        { budget: { contains: search } },
      ]
    }

    const [quotes, total] = await Promise.all([
      db.quoteRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.quoteRequest.count({ where }),
    ])

    res.json(listResponse(quotes.map(mapQuote), total, page, limit))
  })
)

// ─── GET /api/admin/quote-requests/:id ───────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const quote = await db.quoteRequest.findUnique({ where: { id } })
    if (!quote) {
      throw new ApiError('Quote request not found', 404)
    }
    res.json({ data: mapQuote(quote) })
  })
)

// ─── PUT /api/admin/quote-requests/:id ───────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateQuoteSchema)

    const existing = await db.quoteRequest.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Quote request not found', 404)
    }

    const data: any = {}
    if (body.status !== undefined) data.status = body.status
    if (body.name !== undefined) data.name = body.name
    if (body.phone !== undefined) data.phone = body.phone
    if (body.email !== undefined) data.email = body.email || null
    if (body.serviceType !== undefined) data.serviceType = body.serviceType
    if (body.description !== undefined) data.description = body.description
    if (body.address !== undefined) data.address = body.address || null
    if (body.budget !== undefined) data.budget = body.budget || null
    // quotedPrice / adminNotes are not schema fields; ignored.

    const quote = await db.quoteRequest.update({ where: { id }, data })
    res.json({ data: mapQuote(quote) })
  })
)

// ─── DELETE /api/admin/quote-requests/:id ────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.quoteRequest.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Quote request not found', 404)
    }

    await db.quoteRequest.delete({ where: { id } })
    res.json({ message: 'Quote request deleted' })
  })
)

export default router
