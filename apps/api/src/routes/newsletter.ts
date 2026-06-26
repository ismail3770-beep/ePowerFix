import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { validate } from '../middleware/validate'
import { success, error } from '../utils/response'

export const newsletterRouter = Router()

newsletterRouter.post('/', validate(z.object({ email: z.string().email('Invalid email address') })), async (req, res) => {
  try {
    const sub = await db.newsletter.upsert({
      where: { email: req.body.email },
      update: { status: 'ACTIVE' },
      create: { email: req.body.email, status: 'ACTIVE' },
    })
    res.json(success(sub, 'Subscribed successfully'))
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json(error('Already subscribed'))
    res.status(500).json(error(err.message))
  }
})
