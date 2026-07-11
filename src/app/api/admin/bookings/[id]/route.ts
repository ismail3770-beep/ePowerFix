import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

function mapBooking(b: any) {
  if (!b) {return b}
  return {
    ...b,
    date: b.bookingDate,
    time: b.bookingTime,
    scheduledAt: b.bookingDate,
    total: b.totalCost,
  }
}

const BOOKING_INCLUDE = {
  user: { select: { id: true, name: true, email: true, phone: true } },
  service: { select: { id: true, name: true, basePrice: true } },
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateBookingSchema = z.object({
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
}).passthrough()

// ─── GET /api/admin/bookings/[id] ─────────────────────────────────────────────

export const GET = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const booking = await db.serviceBooking.findUnique({
    where: { id },
    include: BOOKING_INCLUDE,
  })
  if (!booking) {return errorResponse('Booking not found', 404)}
  return jsonResponse({ data: mapBooking(booking) })
})

// ─── PUT /api/admin/bookings/[id] ─────────────────────────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id } = await params
  const body = await validateBody(request, updateBookingSchema)

  const existing = await db.serviceBooking.findUnique({ where: { id } })
  if (!existing) {return errorResponse('Booking not found', 404)}

  const data: any = {}
  if (body.status !== undefined) {data.status = body.status}
  if (body.notes !== undefined) {data.notes = body.notes || null}
  if (body.address !== undefined) {data.address = body.address}
  if (body.phone !== undefined) {data.phone = body.phone}
  if (body.customerPhone !== undefined) {data.phone = body.customerPhone}
  if (body.paymentStatus !== undefined) {data.paymentStatus = body.paymentStatus}
  if (body.paymentMethod !== undefined) {data.paymentMethod = body.paymentMethod || null}
  if (body.totalCost !== undefined) {data.totalCost = Number(body.totalCost)}
  if (body.total !== undefined) {data.totalCost = Number(body.total)}
  if (body.bookingDate !== undefined) {data.bookingDate = new Date(body.bookingDate)}
  if (body.bookingTime !== undefined) {data.bookingTime = body.bookingTime}
  if (body.scheduledAt !== undefined) {
    const d = new Date(body.scheduledAt)
    data.bookingDate = d
    if (body.bookingTime === undefined) {
      data.bookingTime = `${String(d.getHours()).padStart(2, '0')}:${String(
        d.getMinutes()
      ).padStart(2, '0')}`
    }
  }

  const booking = await db.serviceBooking.update({
    where: { id },
    data,
    include: BOOKING_INCLUDE,
  })

  return jsonResponse({ data: mapBooking(booking) })
})
