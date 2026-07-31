// Quote request routes: submit a new quote request
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, validateBody, ApiError } from '../lib/api-handler.js'
import { schemas } from '../lib/schemas.js'
import { getSession } from '../lib/auth.js'
import { checkRateLimit } from '../lib/rate-limit.js'

const router = Router()

// ─── POST /api/quote-requests ─────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    // Rate limit: 5 quote requests per 15 min per IP
    const ip = typeof req.ip === 'string' && req.ip.trim() ? req.ip : 'unknown'
    const rateLimit = await checkRateLimit(`quote:${ip}`, 5, 15 * 60 * 1000)
    if (!rateLimit.allowed) {
      throw new ApiError('Too many quote requests. Please try again later.', 429)
    }

    const body = validateBody(req, schemas.quoteRequest)
    const { name, phone, email, serviceType, description, address, budget } = body

    // Public route — attach the user id if they happen to be logged in.
    const sessionUser = await getSession(req)

    const quote = await db.quoteRequest.create({
      data: {
        userId: sessionUser?.id ?? null,
        name,
        phone,
        email: email || null,
        serviceType,
        description,
        address: address || null,
        budget: budget || null,
        status: 'PENDING',
      },
    })

    res.status(201).json({
      data: quote,
      message: 'Quote request submitted',
    })
  })
)

export default router
