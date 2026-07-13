// Settings routes: public site settings (cached, secrets stripped)
import { Router } from 'express'

import { db } from '../lib/db.js'
import { asyncHandler } from '../lib/api-handler.js'
import { cache, cacheKeys } from '../lib/cache.js'

const router = Router()

// ─── GET /api/settings ────────────────────────────────────────────────────────
// Public site settings — cached for 5 minutes.
// Strips all payment-gateway secrets.

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const safe = await cache.getOrSet(cacheKeys.settings(), 300, async () => {
      let settings = await db.siteSettings.findUnique({ where: { id: 'default' } })
      if (!settings) {
        settings = await db.siteSettings.create({ data: { id: 'default' } })
      }

      return {
        id: settings.id,
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
        bkashEnabled: settings.bkashEnabled,
        nagadEnabled: settings.nagadEnabled,
        sslcommerzEnabled: settings.sslcommerzEnabled,
        bankTransferEnabled: settings.bankTransferEnabled,
        bankTransferInstructions: settings.bankTransferInstructions,
        codEnabled: settings.codEnabled,
        shippingInsideDhaka: settings.shippingInsideDhaka,
        shippingOutsideDhaka: settings.shippingOutsideDhaka,
        freeShippingThreshold: settings.freeShippingThreshold,
        shippingInsideDhakaLabel: settings.shippingInsideDhakaLabel,
        shippingOutsideDhakaLabel: settings.shippingOutsideDhakaLabel,
      }
    })

    res.json({ data: safe })
  })
)

export default router
