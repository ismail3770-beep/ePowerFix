import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, validateBody } from '../../lib/api-handler.js'

const router = Router()

const updateSettingsSchema = z.object({
  group: z.string().optional(),
  settings: z.record(z.string(), z.any())
})

// ─── GET /api/admin/storefront-settings ──────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const group = req.query.group as string | undefined
    const where = group ? { group } : {}
    const settings = await db.setting.findMany({ where })
    
    // Convert array of {key, value} to an object { key: parsedValue }
    const settingsObj: Record<string, any> = {}
    for (const s of settings) {
      try {
        settingsObj[s.key] = JSON.parse(s.value)
      } catch (e) {
        settingsObj[s.key] = s.value
      }
    }
    
    res.json({ data: settingsObj })
  })
)

// ─── POST /api/admin/storefront-settings ─────────────────────────────────────
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, updateSettingsSchema)
    const { group, settings } = body

    // Perform upsert for each setting
    const queries = Object.entries(settings).map(([key, value]) => {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      return db.setting.upsert({
        where: { key },
        update: { value: stringValue, group: group || 'storefront' },
        create: { key, value: stringValue, group: group || 'storefront' }
      })
    })

    await db.$transaction(queries)

    res.json({ message: 'Settings saved successfully' })
  })
)

export default router
