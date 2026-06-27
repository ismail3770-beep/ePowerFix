import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAuth } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { success, error } from '../utils/response'
import { authLimiter } from '../middleware/rate-limit'

export const servicesBookRouter = Router()

const bookingSchema = z.object({
  serviceId: z.string().min(1),
  bookingDate: z.string().refine(val => !isNaN(Date.parse(val)) && new Date(val) > new Date(), 'Must be a valid future date'),
  bookingTime: z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
  notes: z.string().optional().default(''),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().regex(/^(\+880|0)1[3-9]\d{8}$/, 'Invalid BD phone number'),
})

// POST /api/services/book — book a service (auth required)
servicesBookRouter.post('/', authLimiter, requireAuth, validate(bookingSchema), async (req, res) => {
  try {
    const data = req.body

    const service = await db.service.findUnique({
      where: { id: data.serviceId },
      select: { id: true, basePrice: true, isActive: true },
    })
    if (!service || !service.isActive) return res.status(404).json(error('Service not available'))

    const booking = await db.serviceBooking.create({
      data: {
        userId: req.user!.id,
        serviceId: data.serviceId,
        bookingDate: new Date(data.bookingDate),
        bookingTime: data.bookingTime,
        notes: data.notes || null,
        address: data.address,
        phone: data.phone,
        totalCost: Number(service.basePrice),
        status: 'PENDING',
      },
    })

    res.status(201).json(success(booking, 'Service booked successfully'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
