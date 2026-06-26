import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { validate } from '../middleware/validate'
import { success, error } from '../utils/response'

export const quoteRequestsRouter = Router()

quoteRequestsRouter.post('/', validate(z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().regex(/^(\+880|0)1[3-9]\d{8}$/),
  serviceType: z.string().min(1),
  description: z.string().min(10),
  address: z.string().optional().default(''),
  budget: z.string().optional().default(''),
})), async (req, res) => {
  try {
    const data = await db.quoteRequest.create({
      data: {
        userId: null,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        serviceType: req.body.serviceType,
        description: req.body.description,
        address: req.body.address || null,
        budget: req.body.budget || null,
      },
    })
    res.status(201).json(success(data, 'Quote request submitted'))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
