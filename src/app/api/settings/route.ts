import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { cache, cacheKeys } from '@/lib/cache'

/**
 * GET /api/settings
 * Public site settings — cached for 5 minutes.
 * Strips all payment-gateway secrets.
 */
export async function GET(_request: NextRequest) {
  try {
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

    return jsonResponse({ data: safe })
  } catch (err: any) {
    console.error('public/settings GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
