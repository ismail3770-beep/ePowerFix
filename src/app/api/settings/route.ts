import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'

/**
 * GET /api/settings
 * Public site settings (branding, contact, social links, etc.).
 * Strips all payment-gateway secrets — those are only available via the
 * admin /api/admin/settings route.
 * Creates a default settings row if none exists yet.
 */
export async function GET(_request: NextRequest) {
  try {
    let settings = await db.siteSettings.findUnique({ where: { id: 'default' } })
    if (!settings) {
      settings = await db.siteSettings.create({ data: { id: 'default' } })
    }

    // Whitelist only the fields the storefront needs. Never expose
    // payment-gateway API keys / secrets to anonymous callers.
    const safe = {
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
      // Payment gateway enable flags (no secrets) — so the storefront
      // knows which payment methods to show at checkout.
      bkashEnabled: settings.bkashEnabled,
      nagadEnabled: settings.nagadEnabled,
      sslcommerzEnabled: settings.sslcommerzEnabled,
      bankTransferEnabled: settings.bankTransferEnabled,
      bankTransferInstructions: settings.bankTransferInstructions,
      codEnabled: settings.codEnabled,
      // Shipping rates — storefront needs these for checkout totals.
      shippingInsideDhaka: settings.shippingInsideDhaka,
      shippingOutsideDhaka: settings.shippingOutsideDhaka,
      freeShippingThreshold: settings.freeShippingThreshold,
      shippingInsideDhakaLabel: settings.shippingInsideDhakaLabel,
      shippingOutsideDhakaLabel: settings.shippingOutsideDhakaLabel,
    }

    return jsonResponse({ data: safe })
  } catch (err: any) {
    console.error('public/settings GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
