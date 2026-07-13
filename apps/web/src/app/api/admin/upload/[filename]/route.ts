import type { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/admin-api'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) {return auth.response!}

    const { filename } = await params

    // Path traversal protection
    if (!filename || filename.includes('..') || filename.startsWith('/') || filename.includes('\\')) {
      return errorResponse('Invalid filename', 400)
    }

    // Search for the file in all upload subdirectories
    const targetPath = path.join(UPLOAD_DIR, filename)

    // First try the direct path
    try {
      await fs.access(targetPath)
      await fs.unlink(targetPath)
      return jsonResponse({ data: { deleted: true } })
    } catch {
      // Not found at root level — search subdirectories
    }

    // Search in subdirectories
    let found = false
    const folders = await fs.readdir(UPLOAD_DIR).catch(() => [] as string[])
    for (const folder of folders) {
      const folderPath = path.join(UPLOAD_DIR, folder)
      const stat = await fs.stat(folderPath).catch(() => null)
      if (!stat || !stat.isDirectory()) {continue}

      const filePath = path.join(folderPath, filename)
      try {
        await fs.access(filePath)
        await fs.unlink(filePath)
        found = true
        break
      } catch {
        // Not in this folder
      }
    }

    if (!found) {
      return errorResponse('File not found', 404)
    }

    return jsonResponse({ data: { deleted: true } })
  } catch (err: any) {
    console.error('[Upload DELETE] Error:', err)
    return errorResponse(err.message || 'Delete failed', 500)
  }
}