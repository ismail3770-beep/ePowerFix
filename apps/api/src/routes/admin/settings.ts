import { Router } from 'express'
import { z } from 'zod'
import { db } from '@epowerfix/db'
import { requireAdmin } from '../../middleware/auth'
import { validate } from '../../middleware/validate'
import { success, error } from '../../utils/response'

export const settingsRouter = Router()

const SETTINGS_ID = 'default'

// Helper: get or create settings row
async function getSettings() {
  let settings = await db.siteSettings.findUnique({ where: { id: SETTINGS_ID } })
  if (!settings) {
    settings = await db.siteSettings.create({ data: { id: SETTINGS_ID } })
  }
  return settings
}

// GET /api/admin/settings
settingsRouter.get('/', requireAdmin, async (_req, res) => {
  try {
    const settings = await getSettings()
    res.json(success(settings))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Failed to load settings'))
  }
})

// Hex color validation (6 chars, no #)
const hexRegex = /^[0-9A-Fa-f]{6}$/

const updateSettingsSchema = z.object({
  siteName: z.string().min(1).max(100).optional(),
  siteTagline: z.string().max(200).nullable().optional(),
  logoUrl: z.string().max(500).nullable().optional(),
  faviconUrl: z.string().max(500).nullable().optional(),
  primaryColor: z.string().regex(hexRegex, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(hexRegex, 'Invalid hex color').optional(),
  accentColor: z.string().regex(hexRegex, 'Invalid hex color').optional(),
  headerBg: z.string().regex(hexRegex, 'Invalid hex color').optional(),
  footerBg: z.string().regex(hexRegex, 'Invalid hex color').optional(),
  bodyBg: z.string().regex(hexRegex, 'Invalid hex color').optional(),
  headingFont: z.string().max(50).optional(),
  bodyFont: z.string().max(50).optional(),
  fontSize: z.string().regex(/^\d{1,2}$/).optional(),
  containerWidth: z.string().regex(/^\d{3,4}$/).optional(),
  facebookUrl: z.string().max(300).nullable().optional(),
  instagramUrl: z.string().max(300).nullable().optional(),
  twitterUrl: z.string().max(300).nullable().optional(),
  youtubeUrl: z.string().max(300).nullable().optional(),
  linkedinUrl: z.string().max(300).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  email: z.string().max(255).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  copyrightText: z.string().max(300).optional(),
  metaTitle: z.string().max(100).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
})

// PUT /api/admin/settings
settingsRouter.put('/', requireAdmin, validate(updateSettingsSchema), async (req, res) => {
  try {
    const settings = await db.siteSettings.upsert({
      where: { id: SETTINGS_ID },
      update: req.body,
      create: { id: SETTINGS_ID, ...req.body },
    })
    res.json(success(settings, 'Settings updated'))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Failed to update settings'))
  }
})