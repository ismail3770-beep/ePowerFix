import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { validate } from '../middleware/validate'
import { contactLimiter } from '../middleware/rate-limit'
import { success, error } from '../utils/response'

export const contactRouter = Router()

contactRouter.post('/', contactLimiter, validate(z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().or(z.literal('')),
  subject: z.string().min(1, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})), async (req, res) => {
  try {
    const msg = await db.contact.create({
      data: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone || null,
        subject: req.body.subject,
        message: req.body.message,
      },
    })
    res.status(201).json(success(msg, 'Message sent successfully'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
