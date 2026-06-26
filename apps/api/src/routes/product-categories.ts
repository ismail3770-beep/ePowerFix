import { Router } from 'express'
import { db } from '@epowerfix/db'
import { success, error } from '../utils/response'

export const productCategoriesRouter = Router()

// GET /api/product-categories — list all active categories for the public shop
productCategoriesRouter.get('/', async (_req, res) => {
  try {
    const categories = await db.productCategory.findMany({
      where: { isActive: true, isDeleted: false },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, nameBn: true, slug: true, image: true, sortOrder: true },
    })
    res.json(success(categories))
  } catch (err: any) {
    res.status(500).json(error(err.message))
  }
})
