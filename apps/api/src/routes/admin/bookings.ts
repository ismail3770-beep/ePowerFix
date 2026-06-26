import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'

export const bookingsRouter = Router()

// GET /api/admin/bookings
bookingsRouter.get('/', requireAdmin, async (req, res) => {
  try {
    const status = req.query.status as string | undefined
    const where: any = {}
    if (status) where.status = status

    const bookings = await db.serviceBooking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        service: { select: { name: true, nameBn: true, category: { select: { name: true } } } },
        user: { select: { name: true, email: true, phone: true } },
      },
    })
    res.json(success(bookings))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// GET /api/admin/bookings/trashed — soft-deleted bookings
bookingsRouter.get('/trashed', requireAdmin, async (_req, res) => {
  try {
    const bookings = await db.serviceBooking.findMany({
      where: { isDeleted: true },
      orderBy: { createdAt: 'desc' },
      include: {
        service: { select: { name: true, nameBn: true, category: { select: { name: true } } } },
        user: { select: { name: true, email: true, phone: true } },
      },
    })
    res.json(success(bookings))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/bookings/:id/restore
bookingsRouter.put('/:id/restore', requireAdmin, async (req, res) => {
  try {
    const booking = await db.serviceBooking.update({ where: { id: req.params.id }, data: { isDeleted: false } })
    res.json(success(booking, 'Booking restored'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// DELETE /api/admin/bookings/:id (soft delete)
bookingsRouter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.serviceBooking.update({ where: { id: req.params.id }, data: { isDeleted: true } })
    res.json(success(null, 'Booking moved to trash'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})

// PUT /api/admin/bookings/:id/status
bookingsRouter.put('/:id/status', requireAdmin, validate(z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
})), async (req, res) => {
  try {
    const booking = await db.serviceBooking.update({
      where: { id: req.params.id },
      data: { status: req.body.status, notes: req.body.notes },
    })
    res.json(success(booking, 'Booking status updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
