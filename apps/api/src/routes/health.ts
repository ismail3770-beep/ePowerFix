// Database-backed readiness check. The root /health route remains liveness-only.
import { Router } from 'express'
import { asyncHandler } from '../lib/api-handler.js'
import { db } from '../lib/db.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    try {
      await db.$queryRaw`SELECT 1`
      res.status(200).json({
        status: 'ready',
        service: 'ePowerFix API',
        timestamp: new Date().toISOString(),
        database: 'ok',
        version: '0.3.0',
      })
    } catch {
      res.status(503).json({
        status: 'not_ready',
        service: 'ePowerFix API',
        timestamp: new Date().toISOString(),
        database: 'error',
        version: '0.3.0',
      })
    }
  })
)

export default router
