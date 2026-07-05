import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

function mapBooking(b: any) {
  if (!b) return b
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

const updateBookingStatusSchema = z.object({
  status: z.string().min(1),
}).passthrough()

/**
 * PUT /api/admin/bookings/[id]/status
 */
export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { id } = await params
  const body = await validateBody(request, updateBookingStatusSchema)

  const existing = await db.serviceBooking.findUnique({ where: { id } })
  if (!existing) return errorResponse('Booking not found', 404)

  const booking = await db.serviceBooking.update({
    where: { id },
    data: { status: body.status.toUpperCase() },
    include: BOOKING_INCLUDE,
  })

  return jsonResponse({ data: mapBooking(booking) })
})
