// Newsletter routes: subscribe
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import { schemas } from '../lib/schemas.js'

const router = Router()

// ─── POST /api/newsletter ─────────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
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
