import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'

/**
 * GET /api/settings
 * Public site settings (branding, contact, social links, etc.).
 * Creates a default settings row if none exists yet.
 */
export async function GET(_request: NextRequest) {
  try {
    let settings = await db.siteSettings.findUnique({ where: { id: 'default' } })
    if (!settings) {
      settings = await db.siteSettings.create({ data: { id: 'default' } })
    }
    return jsonResponse({ data: settings })
  } catch (err: any) {
    console.error('public/settings GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
