import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/admin-api'
import { uploadFile } from '@/lib/cloud-storage'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response!

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return errorResponse('No file provided', 400)
    }

    // Determine folder from optional query param, default to "general"
    const { searchParams } = new URL(req.url)
    const folder = searchParams.get('folder') || 'general'

    const result = await uploadFile(file, folder)

    return jsonResponse({ url: result.url })
  } catch (err: any) {
    console.error('[Upload] Error:', err)
    return errorResponse(err.message || 'Upload failed', 500)
  }
}