import { db } from '@/lib/db'
import { jsonResponse } from '@/lib/auth'
import { authRoute, authGetRoute, z } from '@/lib/api-handler'

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const createAddressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(6).max(20),
  address: z.string().min(3).max(300),
  area: z.string().max(100).optional(),
  city: z.string().min(2).max(100),
  postalCode: z.string().max(20).optional(),
  label: z.string().max(50).optional(),
  isDefault: z.boolean().optional(),
}).passthrough()

// ─── GET: List current user's addresses ───────────────────────────────────────

export const GET = authGetRoute(async (_request, user) => {
  const addresses = await db.userAddress.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })
  return jsonResponse({ data: addresses })
})

// ─── POST: Create a new address ───────────────────────────────────────────────

export const POST = authRoute(createAddressSchema, async (_request, body, user) => {
  // If this address is marked default, unset any existing default first.
  if (body.isDefault) {
    await db.userAddress.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    })
  }

  // If the user has no addresses yet, force this one to be the default.
  const existingCount = await db.userAddress.count({ where: { userId: user.id } })
  const makeDefault = body.isDefault || existingCount === 0

  const address = await db.userAddress.create({
    data: {
      userId: user.id,
      fullName: body.fullName.trim(),
      phone: body.phone.trim(),
      address: body.address.trim(),
      area: body.area?.trim() || null,
      city: body.city.trim(),
      postalCode: body.postalCode?.trim() || null,
      label: body.label?.trim() || null,
      isDefault: makeDefault,
    },
  })

  return jsonResponse({ data: address, message: 'Address added successfully' }, 201)
})
