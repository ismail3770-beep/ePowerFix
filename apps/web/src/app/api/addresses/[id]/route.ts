import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse, requireAuth } from '@/lib/auth'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const updateAddressSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().min(6).max(20).optional(),
  address: z.string().min(3).max(300).optional(),
  area: z.string().max(100).optional(),
  city: z.string().min(2).max(100).optional(),
  postalCode: z.string().max(20).optional(),
  label: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
}).passthrough()

// ─── Helper: ensure address belongs to user ───────────────────────────────────

async function getOwnedAddress(id: string, userId: string) {
  const address = await db.userAddress.findUnique({ where: { id } })
  if (!address || address.userId !== userId) {return null}
  return address
}

// ─── PUT: Update an address (also handles set-default) ────────────────────────

export const PUT = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAuth()
  if (!auth.ok) {return auth.response!}
  const { id } = await params
  const body = await validateBody(request, updateAddressSchema)

  const existing = await getOwnedAddress(id, auth.user!.id)
  if (!existing) {return errorResponse('Address not found', 404)}

  // If marking as default, unset any other default first.
  if (body.isDefault && !existing.isDefault) {
    await db.userAddress.updateMany({
      where: { userId: auth.user!.id, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    })
  }

  const data: any = {}
  if (body.fullName !== undefined) {data.fullName = body.fullName.trim()}
  if (body.phone !== undefined) {data.phone = body.phone.trim()}
  if (body.address !== undefined) {data.address = body.address.trim()}
  if (body.area !== undefined) {data.area = body.area?.trim() || null}
  if (body.city !== undefined) {data.city = body.city.trim()}
  if (body.postalCode !== undefined) {data.postalCode = body.postalCode?.trim() || null}
  if (body.label !== undefined) {data.label = body.label?.trim() || null}
  if (body.isDefault !== undefined) {data.isDefault = body.isDefault}

  const updated = await db.userAddress.update({ where: { id }, data })
  return jsonResponse({ data: updated, message: 'Address updated successfully' })
})

// ─── DELETE: Remove an address ────────────────────────────────────────────────

export const DELETE = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAuth()
  if (!auth.ok) {return auth.response!}
  const { id } = await params

  const existing = await getOwnedAddress(id, auth.user!.id)
  if (!existing) {return errorResponse('Address not found', 404)}

  await db.userAddress.delete({ where: { id } })

  // If the deleted address was the default, promote the most recent remaining
  // address to default (so the user always has a default for checkout).
  if (existing.isDefault) {
    const next = await db.userAddress.findFirst({
      where: { userId: auth.user!.id },
      orderBy: { createdAt: 'desc' },
    })
    if (next) {
      await db.userAddress.update({ where: { id: next.id }, data: { isDefault: true } })
    }
  }

  return jsonResponse({ message: 'Address deleted successfully' })
})
