// Newsletter routes: subscribe
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import { schemas } from '../lib/schemas.js'
import { checkRateLimit } from '../lib/rate-limit.js'

const router = Router()

// ─── POST /api/newsletter ─────────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    // Rate limit: 10 subscriptions per 15 min per IP
    const ip = typeof req.ip === 'string' && req.ip.trim() ? req.ip : 'unknown'
    const rateLimit = await checkRateLimit(`newsletter:${ip}`, 10, 15 * 60 * 1000)
    if (!rateLimit.allowed) {
      throw new ApiError('Too many subscription attempts. Please try again later.', 429)
    }

    const { email } = validateBody(req, schemas.newsletter)
    const normalizedEmail = email.trim().toLowerCase()

    const existing = await db.newsletter.findUnique({ where: { email: normalizedEmail } })
    if (existing) {
      if (existing.status === 'ACTIVE') {
        throw new ApiError('Already subscribed', 409)
      }
      // Reactivate a previously-unsubscribed entry.
      await db.newsletter.update({
        where: { email: normalizedEmail },
        data: { status: 'ACTIVE' },
      })
      return res.json({
        data: { email: normalizedEmail },
        message: 'Re-subscribed successfully',
      })
    }

    await db.newsletter.create({ data: { email: normalizedEmail, status: 'ACTIVE' } })
    res.status(201).json({
      data: { email: normalizedEmail },
      message: 'Subscribed successfully',
    })
  })
)

export default router
