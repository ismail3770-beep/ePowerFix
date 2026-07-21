// Service routes: list, detail, book
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import { parseJsonField } from '../lib/helpers.js'
import { cache, cacheKeys } from '../lib/cache.js'
import { getSession } from '../lib/auth.js'
import { schemas } from '../lib/schemas.js'

const router = Router()

// ─── GET /api/services ────────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, any>
    const categoryParam = query.category || query.categoryId || undefined
    const search = query.search || query.q || ''
    const featured = query.featured === 'true'

    // Skip cache when any filter is present to avoid cache poisoning
    const hasExtraFilters = !!(categoryParam || search || featured)

    const fetchServices = async () => {
      const where: any = { isActive: true }
      if (featured) where.isFeatured = true
      if (categoryParam) {
        const cat = await db.serviceCategory.findFirst({
          where: { OR: [{ id: categoryParam }, { slug: categoryParam }] },
          select: { id: true },
        })
        where.categoryId = cat?.id ?? categoryParam
      }
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { nameBn: { contains: search } },
          { description: { contains: search } },
        ]
      }

      return await db.service.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        include: { category: true },
      })
    }

    const services = hasExtraFilters
      ? await fetchServices()
      : await cache.getOrSet(cacheKeys.services(), 300, fetchServices)

    const parsed = services.map((s: any) => ({
      ...s,
      images: parseJsonField(s.images),
    }))

    // Return both shapes for compatibility:
    //  - ServicesSection reads `data.data.services`
    //  - ServiceBookingDialog reads `data.services` (top-level)
    res.json({ data: { services: parsed }, services: parsed })
  })
)

// ─── GET /api/services/:slug ──────────────────────────────────────────────────

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const { slug } = req.params

    const service = await db.service.findFirst({
      where: { slug, isActive: true },
      include: {
        category: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!service) {
      throw new ApiError('Service not found', 404)
    }

    const parsed = {
      ...service,
      images: parseJsonField(service.images),
    }
    // Frontend expects `data` to be the service object directly.
    res.json({ data: parsed })
  })
)

// ─── POST /api/services/book ──────────────────────────────────────────────────
// Auth optional: guests retain their contact snapshot without requiring a
// synthetic User row or an invalid foreign-key value.

router.post(
  '/book',
  asyncHandler(async (req, res) => {
    const {
      serviceId,
      customerName,
      customerEmail,
      bookingDate,
      bookingTime,
      address,
      phone,
      notes,
    } = validateBody(req, schemas.serviceBooking)

    const service = await db.service.findFirst({
      where: { id: serviceId, isActive: true, isDeleted: false },
    })
    if (!service) {
      throw new ApiError('Service not found', 404)
    }

    // Attach the logged-in user if present. Guest bookings are intentionally
    // represented by a null userId plus immutable contact snapshots.
    const authUser = await getSession(req)

    const booking = await db.serviceBooking.create({
      data: {
        userId: authUser?.id ?? null,
        customerName: customerName?.trim() || authUser?.name || null,
        customerEmail: customerEmail?.trim() || authUser?.email || null,
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

    res.status(201).json({ data: booking, message: 'Booking created successfully' })
  })
)

export default router
