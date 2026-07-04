import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, jsonResponse, errorResponse, parseBody } from '@/lib/admin-api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!
  const { id } = await params
  try {
    const ret = await db.returnRequest.findUnique({
      where: { id },
      include: {
        order: { select: { orderNumber: true } },
        user: { select: { name: true, email: true } },
      },
    })
    if (!ret) return errorResponse('Return request not found', 404)
    return jsonResponse({ data: ret })
  } catch (err: any) {
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!
  const { id } = await params
  const body = await parseBody<any>(request)
  if (!body) return errorResponse('Invalid body', 400)

  try {
    const updated = await db.returnRequest.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.adminNotes ? { adminNotes: body.adminNotes } : {}),
      },
    })
    return jsonResponse({ data: updated })
  } catch (err: any) {
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!
  const { id } = await params
  try {
    await db.returnRequest.delete({ where: { id } })
    return jsonResponse({ message: 'Return request deleted' })
  } catch (err: any) {
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
