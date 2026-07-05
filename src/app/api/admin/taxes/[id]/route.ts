import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'

function mapTax(t: any) {
  if (!t) return t
  return { ...t, value: t.rate }
}

/**
 * GET /api/admin/taxes/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const tax = await db.tax.findUnique({ where: { id } })
    if (!tax) return errorResponse('Tax not found', 404)
    return jsonResponse({ data: mapTax(tax) })
  } catch (err: any) {
    console.error('admin/taxes/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * PUT /api/admin/taxes/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const body = await parseBody<any>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const existing = await db.tax.findUnique({ where: { id } })
    if (!existing) return errorResponse('Tax not found', 404)

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.type !== undefined) {
      const type = (body.type || '').toString().toUpperCase()
      if (!['PERCENTAGE', 'FLAT'].includes(type)) {
        return errorResponse('type must be PERCENTAGE or FLAT', 400)
      }
      data.type = type
    }
    if (body.rate !== undefined || body.value !== undefined) {
      const v = body.rate !== undefined ? body.rate : body.value
      data.rate = Number(v)
    }
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    const tax = await db.tax.update({ where: { id }, data })
    return jsonResponse({ data: mapTax(tax) })
  } catch (err: any) {
    console.error('admin/taxes/[id] PUT error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * DELETE /api/admin/taxes/[id] — soft-delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id } = await params
    const existing = await db.tax.findUnique({ where: { id } })
    if (!existing) return errorResponse('Tax not found', 404)

    await db.tax.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    })

    return jsonResponse({ message: 'Tax deleted' })
  } catch (err: any) {
    console.error('admin/taxes/[id] DELETE error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
