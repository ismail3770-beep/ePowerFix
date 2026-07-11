import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/admin-api'
import { validateBody, z, withErrorHandling } from '@/lib/api-handler'

const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).optional().default(1),
  isRequired: z.boolean().optional().default(true),
  notes: z.string().max(500).optional(),
})

/**
 * GET /api/admin/project-kits/[id]/items
 */
export const GET = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id: kitId } = await params
  const kit = await db.projectKit.findUnique({ where: { id: kitId } })
  if (!kit) {return errorResponse('Kit not found', 404)}

  const items = await db.projectKitItem.findMany({
    where: { kitId },
    include: {
      product: {
        select: { id: true, name: true, price: true, salePrice: true, stock: true, images: true, sku: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return jsonResponse({ data: items })
})

/**
 * POST /api/admin/project-kits/[id]/items
 */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  const { id: kitId } = await params
  const body = await validateBody(request, addItemSchema)

  const kit = await db.projectKit.findUnique({ where: { id: kitId } })
  if (!kit) {return errorResponse('Kit not found', 404)}

  const product = await db.product.findUnique({ where: { id: body.productId } })
  if (!product) {return errorResponse('Product not found', 404)}

  // Prevent duplicates — if already added, just update quantity.
  const existing = await db.projectKitItem.findFirst({
    where: { kitId, productId: body.productId },
  })
  if (existing) {
    const updated = await db.projectKitItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + body.quantity },
      include: { product: { select: { id: true, name: true, price: true, salePrice: true, stock: true, images: true, sku: true } } },
    })
    return jsonResponse({ data: updated, message: 'Quantity updated' })
  }

  const item = await db.projectKitItem.create({
    data: {
      kitId,
      productId: body.productId,
      quantity: body.quantity,
      isRequired: body.isRequired,
      notes: body.notes || null,
    },
    include: { product: { select: { id: true, name: true, price: true, salePrice: true, stock: true, images: true, sku: true } } },
  })

  return jsonResponse({ data: item, message: 'Item added to kit' }, 201)
})
