import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  getPagination,
  listResponse,
} from '@/lib/admin-api'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'

/**
 * Maps a ServiceBooking DB row to the response shape expected by the admin
 * frontend. Exposes both schema field names and convenience aliases.
 */
function mapBooking(b: any) {
  if (!b) {return b}
  return {
    ...b,
    // Aliases the frontend expects
    customerName: b.user?.name || '',
    customerPhone: b.phone || b.user?.phone || '',
    customerEmail: b.user?.email || '',
    preferredDate: b.bookingDate,
    preferredTime: b.bookingTime,
    description: b.notes || '',
    totalPrice: b.totalCost,
    // Short aliases
    date: b.bookingDate,
    time: b.bookingTime,
    scheduledAt: b.bookingDate,
    total: b.totalCost,
    // Normalise service shape so the table can read service.name + category
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
  service: { select: { id: true, name: true, nameBn: true, basePrice: true, category: { select: { name: true } } } },
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createBookingSchema = z.object({
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
}).passthrough()

// ─── GET /api/admin/bookings ──────────────────────────────────────────────────

export const GET = adminGetRoute(async (request) => {
  const { page, limit, skip, search } = getPagination(request.url)
  const url = new URL(request.url)
  const rawStatus = url.searchParams.get('status')
  // Normalise to UPPERCASE so "pending" from the UI matches "PENDING" in DB.
  const status = rawStatus && rawStatus !== 'all' ? rawStatus.toUpperCase() : undefined

  const where: any = {}
  if (status) {where.status = status}
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
})

// ─── POST /api/admin/bookings ─────────────────────────────────────────────────

export const POST = adminRoute(createBookingSchema, async (request, body, user) => {
  const userId = body.userId
  const serviceId = body.serviceId
  if (!userId) {return errorResponse('userId is required', 400)}
  if (!serviceId) {return errorResponse('serviceId is required', 400)}

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
})
