import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/auth'

/**
 * GET /api/admin/ai-providers/active
 * List all enabled AI providers (used by the AI agent page's provider picker).
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  try {
    const providers = await db.aiProvider.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    // Mask api keys before returning.
    const safe = providers.map((p: any) => ({
      ...p,
      apiKey: p.apiKey ? '••••••' : null,
    }))

    return jsonResponse({ data: safe })
  } catch (err: any) {
    console.error('admin/ai-providers/active GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
