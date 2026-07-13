import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/auth'
import { publicRoute, schemas } from '@/lib/api-handler'

/**
 * POST /api/services/book
 * Create a service booking. Auth optional (guests may book with phone).
 * Zod-validated.
 */
export const POST = publicRoute(schemas.serviceBooking, async (request, { serviceId, bookingDate, bookingTime, address, phone, notes }) => {
  const service = await db.service.findFirst({
    where: { id: serviceId, isActive: true },
  })
  if (!service) {return errorResponse('Service not found', 404)}

  // Attach the logged-in user if present (guests may also book).
  const auth = await requireAuth()

  const booking = await db.serviceBooking.create({
    data: {
      userId: auth.ok ? auth.user!.id : ('guest-' + Date.now()),
      serviceId,
      bookingDate: new Date(bookingDate),
      bookingTime,
      address,
      phone,
      notes: notes || null,
      totalCost: service.basePrice,
      status: 'PENDING',
      paymentStatus: 'PENDING',
    },
    include: { service: true },
  })

  return jsonResponse({ data: booking, message: 'Booking created successfully' }, 201)
})
