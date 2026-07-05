import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/admin-api'

/**
 * GET /api/admin/project-kits/[kitId]/items
 * List all product items (components) in a project kit.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id: kitId } = await params
    const kit = await db.projectKit.findUnique({ where: { id: kitId } })
    if (!kit) return errorResponse('Kit not found', 404)

    const items = await db.projectKitItem.findMany({
      where: { kitId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            salePrice: true,
            stock: true,
            images: true,
            sku: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return jsonResponse({ data: items })
  } catch (err: any) {
    console.error('admin/project-kits items GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

/**
 * POST /api/admin/project-kits/[kitId]/items
 * Add a product to a project kit.
 * Body: { productId, quantity?, isRequired?, notes? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { id: kitId } = await params
    const body = await request.json()
    if (!body?.productId) return errorResponse('productId is required', 400)

    const kit = await db.projectKit.findUnique({ where: { id: kitId } })
    if (!kit) return errorResponse('Kit not found', 404)

    const product = await db.product.findUnique({ where: { id: body.productId } })
    if (!product) return errorResponse('Product not found', 404)

    // Prevent duplicates — if already added, just update quantity.
    const existing = await db.projectKitItem.findUnique({
      where: { kitId_productId: { kitId, productId: body.productId } },
    })
    if (existing) {
      const updated = await db.projectKitItem.update({
        where: { id: existing.id },
        data: { quantity: (existing.quantity + (Number(body.quantity) || 1)) },
        include: { product: { select: { id: true, name: true, price: true, salePrice: true, stock: true, images: true, sku: true } } },
      })
      return jsonResponse({ data: updated, message: 'Quantity updated' })
    }

    const item = await db.projectKitItem.create({
      data: {
        kitId,
        productId: body.productId,
        quantity: Number(body.quantity) || 1,
        isRequired: body.isRequired !== undefined ? !!body.isRequired : true,
        notes: body.notes || null,
      },
      include: { product: { select: { id: true, name: true, price: true, salePrice: true, stock: true, images: true, sku: true } } },
    })

    return jsonResponse({ data: item, message: 'Item added to kit' }, 201)
  } catch (err: any) {
    console.error('admin/project-kits items POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
