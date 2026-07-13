// Contact routes: submit a contact message
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler, validateBody } from '../lib/api-handler.js'
import { schemas } from '../lib/schemas.js'
import { getSession } from '../lib/auth.js'

const router = Router()

// ─── POST /api/contact ────────────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, schemas.contact)
    const { name, email, phone, subject, message } = body

    // Public route — attach the user id if they happen to be logged in.
    const sessionUser = await getSession(req)

    const contact = await db.contact.create({
      data: {
        userId: sessionUser?.id ?? null,
        name,
        email,
        phone: phone || null,
        subject,
        message,
        status: 'NEW',
      },
    })

    res.status(201).json({
      data: contact,
      message: 'Message sent successfully',
    })
  })
)

export default router
