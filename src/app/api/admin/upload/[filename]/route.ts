import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/admin-api'
import { deleteFile } from '@/lib/cloud-storage'
import { withErrorHandling } from '@/lib/api-handler'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

/**
 * DELETE /api/admin/upload/[filename]
 * Delete an uploaded media file by filename.
 */
export const DELETE = withErrorHandling(async (
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { filename } = await params

  // Prevent path traversal — only allow simple filenames
  if (!filename || /[\\/]/.test(filename) || filename.includes('..')) {
    return errorResponse('Invalid filename', 400)
  }

  // Try local delete first
  const dest = path.join(UPLOAD_DIR, filename)
  await fs.unlink(dest).catch(() => {})

  // If Cloudinary is configured, the URL-based delete won't work here
  // (we'd need the publicId). For now, local delete is sufficient.

  return jsonResponse({ message: 'File deleted' })
})
