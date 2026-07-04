import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
  getPagination,
  listResponse,
} from '@/lib/admin-api'

/**
 * Maps a ServiceBooking DB row to the response shape expected by the admin
 * frontend. The frontend reads `date`/`time` while the schema stores
 * `bookingDate`/`bookingTime`. We expose both names.
 */
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
 * GET /api/admin/bookings
 * List service bookings with pagination, search, status filter.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { page, limit, skip, search } = getPagination(request.url)
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || undefined

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

    return listResponse(bookings.map(mapBooking), total, page, limit)
  } catch (err: any) {
    console.error('admin/bookings GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/bookings
 * Create a booking. Body accepts both task-spec names (scheduledAt,
 * customerName, customerPhone, customerEmail) and schema names (bookingDate,
 * bookingTime, phone, address).
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const userId = body.userId
    const serviceId = body.serviceId
    if (!userId) return errorResponse('userId is required', 400)
    if (!serviceId) return errorResponse('serviceId is required', 400)

    // bookingDate / bookingTime
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    const bookingDate = body.bookingDate
      ? new Date(body.bookingDate)
      : scheduledAt || new Date()
    const bookingTime =
      body.bookingTime ||
      (scheduledAt
        ? `${String(scheduledAt.getHours()).padStart(2, '0')}:${String(
            scheduledAt.getMinutes()
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

    return jsonResponse({ data: mapBooking(booking) }, 201)
  } catch (err: any) {
    console.error('admin/bookings POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
