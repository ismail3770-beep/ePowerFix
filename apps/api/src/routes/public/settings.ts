import { Router } from 'express'
import { db } from '@epowerfix/db'
import { success, error } from '../../utils/response'

export const settingsRouter = Router()

const SETTINGS_ID = 'default'

// GET /api/settings — public, returns theme-safe fields only
settingsRouter.get('/', async (_req, res) => {
  try {
    let settings = await db.siteSettings.findUnique({ where: { id: SETTINGS_ID } })
    if (!settings) {
      settings = await db.siteSettings.create({ data: { id: SETTINGS_ID } })
    }
    // Only expose public-safe fields
    const publicSettings = {
      siteName: settings.siteName,
      siteTagline: settings.siteTagline,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      accentColor: settings.accentColor,
      headerBg: settings.headerBg,
      footerBg: settings.footerBg,
      bodyBg: settings.bodyBg,
      headingFont: settings.headingFont,
      bodyFont: settings.bodyFont,
      fontSize: settings.fontSize,
      containerWidth: settings.containerWidth,
      facebookUrl: settings.facebookUrl,
      instagramUrl: settings.instagramUrl,
      twitterUrl: settings.twitterUrl,
      youtubeUrl: settings.youtubeUrl,
      linkedinUrl: settings.linkedinUrl,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      copyrightText: settings.copyrightText,
      metaTitle: settings.metaTitle,
      metaDescription: settings.metaDescription,
    }
    res.json(success(publicSettings))
  } catch (err: any) {
    res.status(500).json(error(err.message || 'Failed to load settings'))
  }
})