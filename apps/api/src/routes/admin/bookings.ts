// Admin booking routes: list, create, get, update, status update.
// Migrated from apps/web/src/app/api/admin/bookings/route.ts, [id]/route.ts and [id]/status/route.ts.
//
// Mounted at /api/admin/bookings

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'
import {
  getPagination,
  listResponse,
} from '../../lib/helpers.js'

const router = Router()

/**
 * Maps a ServiceBooking DB row to the response shape expected by the admin
 * frontend. Exposes both schema field names and convenience aliases.
 */
function mapBooking(b: any) {
  if (!b) return b
  return {
    ...b,
    customerName: b.user?.name || '',
    customerPhone: b.phone || b.user?.phone || '',
    customerEmail: b.user?.email || '',
    preferredDate: b.bookingDate,
    preferredTime: b.bookingTime,
    description: b.notes || '',
    totalPrice: b.totalCost,
    date: b.bookingDate,
    time: b.bookingTime,
    scheduledAt: b.bookingDate,
    total: b.totalCost,
    service: b.service
      ? {
          ...b.service,
          nameBn: b.service.nameBn || '',
          category: (b.service as any).category || { name: 'General' },
        }
      : { name: 'Unknown', nameBn: '', category: { name: 'General' } },
  }
}

const BOOKING_INCLUDE = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  service: {
    select: {
      id: true,
      name: true,
      nameBn: true,
      basePrice: true,
      category: { select: { name: true } },
    },
  },
}

const BOOKING_INCLUDE_DETAIL = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  service: { select: { id: true, name: true, basePrice: true } },
}

function mapBookingDetail(b: any) {
  if (!b) return b
  return {
    ...b,
    date: b.bookingDate,
    time: b.bookingTime,
    scheduledAt: b.bookingDate,
    total: b.totalCost,
  }
}

const createBookingSchema = z
  .object({
    userId: z.string().min(1),
    serviceId: z.string().min(1),
    bookingDate: z.string().optional(),
    bookingTime: z.string().optional(),
    scheduledAt: z.string().optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    customerPhone: z.string().optional(),
    totalCost: z.number().optional(),
    total: z.number().optional(),
    paymentStatus: z.string().optional(),
    paymentMethod: z.string().optional(),
  })
  .passthrough()

const updateBookingSchema = z
  .object({
    status: z.string().optional(),
    notes: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    customerPhone: z.string().optional(),
    paymentStatus: z.string().optional(),
    paymentMethod: z.string().optional(),
    totalCost: z.number().optional(),
    total: z.number().optional(),
    bookingDate: z.string().optional(),
    bookingTime: z.string().optional(),
    scheduledAt: z.string().optional(),
  })
  .passthrough()

const updateBookingStatusSchema = z
  .object({
    status: z.string().min(1),
  })
  .passthrough()

// ─── GET /api/admin/bookings ─────────────────────────────────────────────────

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
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { user: { phone: { contains: search } } },
        { service: { name: { contains: search } } },
        { address: { contains: search } },
        { phone: { contains: search } },
        { notes: { contains: search } },
      ]
    }

    const [bookings, total] = await Promise.all([
      db.serviceBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: BOOKING_INCLUDE,
      }),
      db.serviceBooking.count({ where }),
    ])

    res.json(listResponse(bookings.map(mapBooking), total, page, limit))
  })
)

// ─── POST /api/admin/bookings ────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, createBookingSchema)

    const userId = body.userId
    const serviceId = body.serviceId
    if (!userId) {
      throw new ApiError('userId is required', 400)
    }
    if (!serviceId) {
      throw new ApiError('serviceId is required', 400)
    }

    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    const bookingDate = body.bookingDate
      ? new Date(body.bookingDate)
      : scheduledAt || new Date()
    const bookingTime =
      body.bookingTime ||
      (scheduledAt
        ? `${String(scheduledAt.getHours()).padStart(2, '0')}:${String(
            scheduledAt.getMinutes(),
          ).padStart(2, '0')}`
        : '10:00')

    const booking = await db.serviceBooking.create({
      data: {
        userId,
        serviceId,
        bookingDate,
        bookingTime,
        status: body.status || 'PENDING',
        notes: body.notes || null,
        address: body.address || '',
        phone: body.customerPhone || body.phone || '',
        totalCost:
          body.totalCost !== undefined
            ? Number(body.totalCost)
            : body.total !== undefined
            ? Number(body.total)
            : 0,
        paymentStatus: body.paymentStatus || 'PENDING',
        paymentMethod: body.paymentMethod || null,
      },
      include: BOOKING_INCLUDE,
    })

    res.status(201).json({ data: mapBooking(booking) })
  })
)

// ─── GET /api/admin/bookings/:id ─────────────────────────────────────────────

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const booking = await db.serviceBooking.findUnique({
      where: { id },
      include: BOOKING_INCLUDE_DETAIL,
    })
    if (!booking) {
      throw new ApiError('Booking not found', 404)
    }
    res.json({ data: mapBookingDetail(booking) })
  })
)

// ─── PUT /api/admin/bookings/:id ─────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateBookingSchema)

    const existing = await db.serviceBooking.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Booking not found', 404)
    }

    const data: any = {}
    if (body.status !== undefined) data.status = body.status
    if (body.notes !== undefined) data.notes = body.notes || null
    if (body.address !== undefined) data.address = body.address
    if (body.phone !== undefined) data.phone = body.phone
    if (body.customerPhone !== undefined) data.phone = body.customerPhone
    if (body.paymentStatus !== undefined) data.paymentStatus = body.paymentStatus
    if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod || null
    if (body.totalCost !== undefined) data.totalCost = Number(body.totalCost)
    if (body.total !== undefined) data.totalCost = Number(body.total)
    if (body.bookingDate !== undefined) data.bookingDate = new Date(body.bookingDate)
    if (body.bookingTime !== undefined) data.bookingTime = body.bookingTime
    if (body.scheduledAt !== undefined) {
      const d = new Date(body.scheduledAt)
      data.bookingDate = d
      if (body.bookingTime === undefined) {
        data.bookingTime = `${String(d.getHours()).padStart(2, '0')}:${String(
          d.getMinutes(),
        ).padStart(2, '0')}`
      }
    }

    const booking = await db.serviceBooking.update({
      where: { id },
      data,
      include: BOOKING_INCLUDE_DETAIL,
    })

    res.json({ data: mapBookingDetail(booking) })
  })
)

// ─── PUT /api/admin/bookings/:id/status ──────────────────────────────────────

router.put(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, updateBookingStatusSchema)

    const existing = await db.serviceBooking.findUnique({ where: { id } })
    if (!existing) {
      throw new ApiError('Booking not found', 404)
    }

    const booking = await db.serviceBooking.update({
      where: { id },
      data: { status: body.status.toUpperCase() },
      include: BOOKING_INCLUDE_DETAIL,
    })

    res.json({ data: mapBookingDetail(booking) })
  })
)

export default router
