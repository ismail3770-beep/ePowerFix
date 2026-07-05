import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/auth'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

/**
 * DELETE /api/admin/upload/[filename]
 * Delete an uploaded media file by filename.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { filename } = await params
    // Prevent path traversal — only allow simple filenames.
    if (!filename || /[\\/]/.test(filename) || filename.includes('..')) {
      return errorResponse('Invalid filename', 400)
    }
    const dest = path.join(UPLOAD_DIR, filename)
    await fs.unlink(dest).catch(() => {})
    return jsonResponse({ message: 'File deleted' })
  } catch (err: any) {
    console.error('admin/upload/[filename] DELETE error:', err)
    return errorResponse(err?.message || 'Delete failed', 500)
  }
}
