/**
 * Shared helpers for admin API routes.
 * Handles pagination, JSON string field parsing, and common response shapes.
 */

import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/auth'

export { requireAdmin, jsonResponse, errorResponse, parseBody }

/**
 * Parses JSON string fields (images, tags) into arrays for API responses.
 * SQLite stores these as TEXT containing a JSON-stringified array.
 */
export function parseJsonField<T = string>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) return value as T[]
  if (typeof value !== 'string') return fallback
  if (!value || value === '[]' || value === 'null') return fallback
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

/**
 * Serializes an array into a JSON string for SQLite storage.
 */
export function stringifyJsonField(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return JSON.stringify(value)
  return '[]'
}

/**
 * Reads pagination params from a URL search params object.
 */
export function getPagination(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)))
  const search = url.searchParams.get('search') || url.searchParams.get('q') || ''
  const skip = (page - 1) * limit
  return { page, limit, skip, search }
}

/**
 * Wraps a list response in the standard { data: { data: [], total, page, limit } } shape.
 */
export function listResponse(data: any[], total: number, page: number, limit: number) {
  return jsonResponse({
    data: {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}

/**
 * Standard GET handler factory for admin list endpoints.
 */
export async function withAdmin<T>(
  handler: (userId: string) => Promise<T>
): Promise<T | Response> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!
  try {
    return await handler(auth.user!.id)
  } catch (err: any) {
    console.error('Admin API error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
