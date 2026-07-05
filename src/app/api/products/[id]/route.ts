import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jsonResponse, errorResponse } from '@/lib/auth'
import { parseJsonField } from '@/lib/admin-api'

/**
 * GET /api/products/[id]
 * Public product detail by id or slug.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await db.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isActive: true,
      },
      include: {
        category: true,
        brand: true,
        variants: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!product) return errorResponse('Product not found', 404)

    const related = await db.product.findMany({
      where: {
        categoryId: product.categoryId,
        isActive: true,
        id: { not: product.id },
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { category: true, brand: true },
    })

    const parsed = {
      ...product,
      images: parseJsonField(product.images),
      tags: parseJsonField(product.tags),
      reviews: product.reviews,
    }

    const parsedRelated = related.map((p: any) => ({
      ...p,
      images: parseJsonField(p.images),
      tags: parseJsonField(p.tags),
    }))

    return jsonResponse({ data: { product: parsed, related: parsedRelated } })
  } catch (err: any) {
    console.error('public/products/[id] GET error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
