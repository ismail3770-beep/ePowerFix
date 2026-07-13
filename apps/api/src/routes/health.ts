// Health check route
import { Router } from 'express'
import { asyncHandler } from '../lib/api-handler.js'
import { db } from '../lib/db.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    // Test database connection
    let dbStatus = 'ok'
    try {
      await db.$queryRaw`SELECT 1`
    } catch {
      dbStatus = 'error'
    }

    res.json({
      status: 'ok',
      service: 'ePowerFix API',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      version: '0.2.0',
    })
  })
)

export default router
