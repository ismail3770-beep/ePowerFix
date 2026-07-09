import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
} from '@/lib/admin-api'
import { parseJsonField, stringifyJsonField } from '@/lib/admin-api'
import { adminGetRoute, adminRoute, z } from '@/lib/api-handler'

const SETTINGS_ID = 'default'

/**
 * Maps a SiteSettings DB row to the response shape expected by the admin frontend.
 */
function mapSettings(s: any) {
  if (!s) return s
  return {
    ...s,
    siteName: s.siteName,
    description: s.siteTagline,
    logo: s.logoUrl,
    favicon: s.faviconUrl,
    contactEmail: s.email,
    contactPhone: s.phone,
    address: s.address,
    socialLinks: {
      facebook: s.facebookUrl,
      instagram: s.instagramUrl,
      twitter: s.twitterUrl,
      youtube: s.youtubeUrl,
      linkedin: s.linkedinUrl,
    },
    meta: { title: s.metaTitle, description: s.metaDescription },
    colors: {
      primary: s.primaryColor, secondary: s.secondaryColor, accent: s.accentColor,
      headerBg: s.headerBg, footerBg: s.footerBg, bodyBg: s.bodyBg,
    },
    typography: { headingFont: s.headingFont, bodyFont: s.bodyFont, fontSize: s.fontSize },
    layout: { containerWidth: s.containerWidth },
    footer: { copyrightText: s.copyrightText },
  }
}

// ─── Zod Schema (partial — accepts any subset of settings fields) ────────────

const updateSettingsSchema = z.object({
  // Brand
  siteName: z.string().max(200).optional(),
  siteTagline: z.string().max(500).optional(),
  description: z.string().max(500).optional(), // alias for siteTagline
  logoUrl: z.string().optional(),
  logo: z.string().optional(), // alias
  faviconUrl: z.string().optional(),
  favicon: z.string().optional(), // alias

  // Colors
  primaryColor: z.string().max(6).optional(),
  secondaryColor: z.string().max(6).optional(),
  accentColor: z.string().max(6).optional(),
  headerBg: z.string().max(6).optional(),
  footerBg: z.string().max(6).optional(),
  bodyBg: z.string().max(6).optional(),
  colors: z.object({
    primary: z.string().optional(), secondary: z.string().optional(),
    accent: z.string().optional(), headerBg: z.string().optional(),
    footerBg: z.string().optional(), bodyBg: z.string().optional(),
  }).optional(),

  // Typography
  headingFont: z.string().max(100).optional(),
  bodyFont: z.string().max(100).optional(),
  fontSize: z.union([z.string(), z.number()]).optional(),
  typography: z.object({
    headingFont: z.string().optional(), bodyFont: z.string().optional(),
    fontSize: z.union([z.string(), z.number()]).optional(),
  }).optional(),

  // Layout
  containerWidth: z.union([z.string(), z.number()]).optional(),
  layout: z.object({ containerWidth: z.union([z.string(), z.number()]).optional() }).optional(),

  // Social
  facebookUrl: z.string().url().optional().or(z.literal('')),
  instagramUrl: z.string().url().optional().or(z.literal('')),
  twitterUrl: z.string().url().optional().or(z.literal('')),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  socialLinks: z.object({
    facebook: z.string().optional(), instagram: z.string().optional(),
    twitter: z.string().optional(), youtube: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),

  // Contact
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  address: z.string().max(500).optional(),

  // Footer
  copyrightText: z.string().max(500).optional(),
  footer: z.object({ copyrightText: z.string().optional() }).optional(),

  // Meta
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(1000).optional(),
  meta: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),

  // Payment Gateways — bKash
  bkashEnabled: z.boolean().optional(),
  bkashPhoneNumber: z.string().optional(),
  bkashApiKey: z.string().optional(),
  bkashSecretKey: z.string().optional(),
  bkashSandbox: z.boolean().optional(),

  // Payment Gateways — Nagad
  nagadEnabled: z.boolean().optional(),
  nagadPhoneNumber: z.string().optional(),
  nagadApiKey: z.string().optional(),
  nagadSecretKey: z.string().optional(),
  nagadSandbox: z.boolean().optional(),

  // Payment Gateways — SSLCommerz
  sslcommerzEnabled: z.boolean().optional(),
  sslcommerzStoreId: z.string().optional(),
  sslcommerzStorePassword: z.string().optional(),
  sslcommerzSandbox: z.boolean().optional(),

  // Payment Gateways — Bank Transfer
  bankTransferEnabled: z.boolean().optional(),
  bankTransferInstructions: z.string().optional(),

  // Payment Gateways — COD
  codEnabled: z.boolean().optional(),
  codFee: z.number().min(0).optional(),

  // Shipping
  shippingInsideDhaka: z.number().min(0).optional(),
  shippingOutsideDhaka: z.number().min(0).optional(),
  freeShippingThreshold: z.number().min(0).optional(),
  shippingInsideDhakaLabel: z.string().max(100).optional(),
  shippingOutsideDhakaLabel: z.string().max(100).optional(),

  // Grouped payment gateways (optional convenience)
  paymentGateways: z.object({
    bkash: z.object({
      enabled: z.boolean().optional(), phoneNumber: z.string().optional(),
      apiKey: z.string().optional(), secretKey: z.string().optional(), sandbox: z.boolean().optional(),
    }).optional(),
    nagad: z.object({
      enabled: z.boolean().optional(), phoneNumber: z.string().optional(),
      apiKey: z.string().optional(), secretKey: z.string().optional(), sandbox: z.boolean().optional(),
    }).optional(),
    sslcommerz: z.object({
      enabled: z.boolean().optional(), storeId: z.string().optional(),
      storePassword: z.string().optional(), sandbox: z.boolean().optional(),
    }).optional(),
    bankTransfer: z.object({
      enabled: z.boolean().optional(), instructions: z.string().optional(),
    }).optional(),
    cod: z.object({
      enabled: z.boolean().optional(), fee: z.number().optional(),
    }).optional(),
  }).optional(),
}).passthrough() // Allow unknown fields for backward compatibility

// ─── GET: Fetch settings ─────────────────────────────────────────────────────

export const GET = adminGetRoute(async () => {
  let settings = await db.siteSettings.findUnique({ where: { id: SETTINGS_ID } })
  if (!settings) {
    settings = await db.siteSettings.create({ data: { id: SETTINGS_ID } })
  }
  return jsonResponse({ data: settings })
})

// ─── PUT: Update settings ────────────────────────────────────────────────────

export const PUT = adminRoute(updateSettingsSchema, async (request, body, user) => {
  const data: any = {}

  // Brand
  if (body.siteName !== undefined) data.siteName = body.siteName
  if (body.siteTagline !== undefined) data.siteTagline = body.siteTagline
  if (body.description !== undefined) data.siteTagline = body.description
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl
  if (body.logo !== undefined) data.logoUrl = body.logo
  if (body.faviconUrl !== undefined) data.faviconUrl = body.faviconUrl
  if (body.favicon !== undefined) data.faviconUrl = body.favicon

  // Colors
  if (body.primaryColor !== undefined) data.primaryColor = body.primaryColor
  if (body.secondaryColor !== undefined) data.secondaryColor = body.secondaryColor
  if (body.accentColor !== undefined) data.accentColor = body.accentColor
  if (body.headerBg !== undefined) data.headerBg = body.headerBg
  if (body.footerBg !== undefined) data.footerBg = body.footerBg
  if (body.bodyBg !== undefined) data.bodyBg = body.bodyBg
  if (body.colors) {
    if (body.colors.primary !== undefined) data.primaryColor = body.colors.primary
    if (body.colors.secondary !== undefined) data.secondaryColor = body.colors.secondary
    if (body.colors.accent !== undefined) data.accentColor = body.colors.accent
    if (body.colors.headerBg !== undefined) data.headerBg = body.colors.headerBg
    if (body.colors.footerBg !== undefined) data.footerBg = body.colors.footerBg
    if (body.colors.bodyBg !== undefined) data.bodyBg = body.colors.bodyBg
  }

  // Typography
  if (body.headingFont !== undefined) data.headingFont = body.headingFont
  if (body.bodyFont !== undefined) data.bodyFont = body.bodyFont
  if (body.fontSize !== undefined) data.fontSize = String(body.fontSize)
  if (body.typography) {
    if (body.typography.headingFont !== undefined) data.headingFont = body.typography.headingFont
    if (body.typography.bodyFont !== undefined) data.bodyFont = body.typography.bodyFont
    if (body.typography.fontSize !== undefined) data.fontSize = String(body.typography.fontSize)
  }

  // Layout
  if (body.containerWidth !== undefined) data.containerWidth = String(body.containerWidth)
  if (body.layout?.containerWidth !== undefined) data.containerWidth = String(body.layout.containerWidth)

  // Social
  if (body.facebookUrl !== undefined) data.facebookUrl = body.facebookUrl
  if (body.instagramUrl !== undefined) data.instagramUrl = body.instagramUrl
  if (body.twitterUrl !== undefined) data.twitterUrl = body.twitterUrl
  if (body.youtubeUrl !== undefined) data.youtubeUrl = body.youtubeUrl
  if (body.linkedinUrl !== undefined) data.linkedinUrl = body.linkedinUrl
  if (body.socialLinks) {
    if (body.socialLinks.facebook !== undefined) data.facebookUrl = body.socialLinks.facebook
    if (body.socialLinks.instagram !== undefined) data.instagramUrl = body.socialLinks.instagram
    if (body.socialLinks.twitter !== undefined) data.twitterUrl = body.socialLinks.twitter
    if (body.socialLinks.youtube !== undefined) data.youtubeUrl = body.socialLinks.youtube
    if (body.socialLinks.linkedin !== undefined) data.linkedinUrl = body.socialLinks.linkedin
  }

  // Contact
  if (body.phone !== undefined) data.phone = body.phone
  if (body.contactPhone !== undefined) data.phone = body.contactPhone
  if (body.email !== undefined) data.email = body.email
  if (body.contactEmail !== undefined) data.email = body.contactEmail
  if (body.address !== undefined) data.address = body.address

  // Footer
  if (body.copyrightText !== undefined) data.copyrightText = body.copyrightText
  if (body.footer?.copyrightText !== undefined) data.copyrightText = body.footer.copyrightText

  // Meta
  if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle
  if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription
  if (body.meta) {
    if (body.meta.title !== undefined) data.metaTitle = body.meta.title
    if (body.meta.description !== undefined) data.metaDescription = body.meta.description
  }

  // Payment Gateways — bKash
  if (body.bkashEnabled !== undefined) data.bkashEnabled = !!body.bkashEnabled
  if (body.bkashPhoneNumber !== undefined) data.bkashPhoneNumber = body.bkashPhoneNumber || null
  if (body.bkashApiKey !== undefined) data.bkashApiKey = body.bkashApiKey || null
  if (body.bkashSecretKey !== undefined) data.bkashSecretKey = body.bkashSecretKey || null
  if (body.bkashSandbox !== undefined) data.bkashSandbox = !!body.bkashSandbox

  // Payment Gateways — Nagad
  if (body.nagadEnabled !== undefined) data.nagadEnabled = !!body.nagadEnabled
  if (body.nagadPhoneNumber !== undefined) data.nagadPhoneNumber = body.nagadPhoneNumber || null
  if (body.nagadApiKey !== undefined) data.nagadApiKey = body.nagadApiKey || null
  if (body.nagadSecretKey !== undefined) data.nagadSecretKey = body.nagadSecretKey || null
  if (body.nagadSandbox !== undefined) data.nagadSandbox = !!body.nagadSandbox

  // Payment Gateways — SSLCommerz
  if (body.sslcommerzEnabled !== undefined) data.sslcommerzEnabled = !!body.sslcommerzEnabled
  if (body.sslcommerzStoreId !== undefined) data.sslcommerzStoreId = body.sslcommerzStoreId || null
  if (body.sslcommerzStorePassword !== undefined) data.sslcommerzStorePassword = body.sslcommerzStorePassword || null
  if (body.sslcommerzSandbox !== undefined) data.sslcommerzSandbox = !!body.sslcommerzSandbox

  // Payment Gateways — Bank Transfer
  if (body.bankTransferEnabled !== undefined) data.bankTransferEnabled = !!body.bankTransferEnabled
  if (body.bankTransferInstructions !== undefined) data.bankTransferInstructions = body.bankTransferInstructions || null

  // Payment Gateways — COD
  if (body.codEnabled !== undefined) data.codEnabled = !!body.codEnabled
  if (body.codFee !== undefined) data.codFee = Number(body.codFee) || 0

  // Shipping
  if (body.shippingInsideDhaka !== undefined) data.shippingInsideDhaka = Number(body.shippingInsideDhaka) || 0
  if (body.shippingOutsideDhaka !== undefined) data.shippingOutsideDhaka = Number(body.shippingOutsideDhaka) || 0
  if (body.freeShippingThreshold !== undefined) data.freeShippingThreshold = Number(body.freeShippingThreshold) || 0
  if (body.shippingInsideDhakaLabel !== undefined) data.shippingInsideDhakaLabel = body.shippingInsideDhakaLabel
  if (body.shippingOutsideDhakaLabel !== undefined) data.shippingOutsideDhakaLabel = body.shippingOutsideDhakaLabel

  // Grouped paymentGateways object
  if (body.paymentGateways) {
    const pg = body.paymentGateways
    if (pg.bkash) {
      if (pg.bkash.enabled !== undefined) data.bkashEnabled = !!pg.bkash.enabled
      if (pg.bkash.phoneNumber !== undefined) data.bkashPhoneNumber = pg.bkash.phoneNumber
      if (pg.bkash.apiKey !== undefined) data.bkashApiKey = pg.bkash.apiKey
      if (pg.bkash.secretKey !== undefined) data.bkashSecretKey = pg.bkash.secretKey
      if (pg.bkash.sandbox !== undefined) data.bkashSandbox = !!pg.bkash.sandbox
    }
    if (pg.nagad) {
      if (pg.nagad.enabled !== undefined) data.nagadEnabled = !!pg.nagad.enabled
      if (pg.nagad.phoneNumber !== undefined) data.nagadPhoneNumber = pg.nagad.phoneNumber
      if (pg.nagad.apiKey !== undefined) data.nagadApiKey = pg.nagad.apiKey
      if (pg.nagad.secretKey !== undefined) data.nagadSecretKey = pg.nagad.secretKey
      if (pg.nagad.sandbox !== undefined) data.nagadSandbox = !!pg.nagad.sandbox
    }
    if (pg.sslcommerz) {
      if (pg.sslcommerz.enabled !== undefined) data.sslcommerzEnabled = !!pg.sslcommerz.enabled
      if (pg.sslcommerz.storeId !== undefined) data.sslcommerzStoreId = pg.sslcommerz.storeId
      if (pg.sslcommerz.storePassword !== undefined) data.sslcommerzStorePassword = pg.sslcommerz.storePassword
      if (pg.sslcommerz.sandbox !== undefined) data.sslcommerzSandbox = !!pg.sslcommerz.sandbox
    }
    if (pg.bankTransfer) {
      if (pg.bankTransfer.enabled !== undefined) data.bankTransferEnabled = !!pg.bankTransfer.enabled
      if (pg.bankTransfer.instructions !== undefined) data.bankTransferInstructions = pg.bankTransfer.instructions
    }
    if (pg.cod) {
      if (pg.cod.enabled !== undefined) data.codEnabled = !!pg.cod.enabled
      if (pg.cod.fee !== undefined) data.codFee = Number(pg.cod.fee) || 0
    }
  }

  const settings = await db.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID, ...data },
    update: data,
  })

  // Invalidate cached public settings
  const { cache } = await import('@/lib/cache')
  await cache.del('settings:default')

  return jsonResponse({ data: settings })
})
