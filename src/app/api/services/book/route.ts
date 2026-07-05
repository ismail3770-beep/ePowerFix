import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth, parseBody } from '@/lib/auth'

/**
 * POST /api/services/book
 * Create a service booking. Auth optional (guests may book with phone).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const { serviceId, bookingDate, bookingTime, address, phone, notes } = body
    if (!serviceId) return errorResponse('serviceId is required', 400)
    if (!bookingDate) return errorResponse('bookingDate is required', 400)
    if (!bookingTime) return errorResponse('bookingTime is required', 400)
    if (!address) return errorResponse('address is required', 400)
    if (!phone) return errorResponse('phone is required', 400)

    const service = await db.service.findFirst({
      where: { id: serviceId, isActive: true },
    })
    if (!service) return errorResponse('Service not found', 404)

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
  } catch (err: any) {
    console.error('public/services/book POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
