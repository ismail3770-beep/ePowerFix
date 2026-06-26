import { Router } from 'express'
import { db } from '@epowerfix/db'
import { success, error } from '../utils/response'

export const brandsRouter = Router()

// GET /api/brands — list all active brands
brandsRouter.get('/', async (_req, res) => {
  try {
    const brands = await db.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, nameBn: true, slug: true, logo: true, country: true },
    })
    res.json(success(brands))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
