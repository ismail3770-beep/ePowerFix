import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

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

/**
 * PUT /api/admin/bookings/[id]/status
 * Update only the booking status. Body: { status }.
 *
 * NOTE: The admin bookings page currently calls `PUT /api/admin/bookings/:id`
 * with `{ status }` (the [id] route handler also accepts `status`). This
 * dedicated `/status` endpoint is provided for clients that prefer it and
 * matches the worklog's recommended path.
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
    if (!body?.status) return errorResponse('status is required', 400)

    const existing = await db.serviceBooking.findUnique({ where: { id } })
    if (!existing) return errorResponse('Booking not found', 404)

    const booking = await db.serviceBooking.update({
      where: { id },
      // Normalise to UPPERCASE to match DB values.
      data: { status: body.status.toUpperCase() },
      include: BOOKING_INCLUDE,
    })

    return jsonResponse({ data: mapBooking(booking) })
  } catch (err: any) {
    console.error('admin/bookings/[id]/status PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
