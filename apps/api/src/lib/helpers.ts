// Shared helpers for API routes
// Pagination, JSON field parsing, Decimal utilities, list responses, etc.

import { Prisma } from '@prisma/client'

/**
 * Converts a Prisma Decimal (or number/string) to a plain JS number.
 * Use when building API responses or doing arithmetic with monetary fields.
 */
export function toNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  return value.toNumber()
}

/**
 * Converts a Prisma Decimal to a fixed-precision string for display (e.g. "1250.00").
 */
export function toFixedString(value: Prisma.Decimal | number | string | null | undefined, dp = 2): string {
  return toNumber(value).toFixed(dp)
}

/**
 * Parses JSON string fields (images, tags) into arrays for API responses.
 * PostgreSQL stores these as TEXT containing a JSON-stringified array.
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
 * Serializes an array into a JSON string for storage.
 */
export function stringifyJsonField(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return JSON.stringify(value)
  return '[]'
}

/**
 * Reads pagination params from Express request query.
 */
export function getPagination(query: Record<string, any>) {
  const page = Math.max(1, parseInt(query.page || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)))
  const search = query.search || query.q || ''
  const skip = (page - 1) * limit
  return { page, limit, skip, search }
}

/**
 * Standard list response shape.
 */
export function listResponse(data: any[], total: number, page: number, limit: number) {
  return {
    data: {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}
