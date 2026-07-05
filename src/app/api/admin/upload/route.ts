import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/admin-api'
import { uploadFile, deleteFile } from '@/lib/cloud-storage'
import { withErrorHandling, validateBody, z } from '@/lib/api-handler'
import { promises as fs } from 'fs'
import path from 'path'

interface MediaFile {
  filename: string
  url: string
  size: number
  createdAt: string
  publicId?: string
}

// In-memory metadata store (for local mode). Cloudinary stores its own metadata.
const mediaStore: MediaFile[] = []

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

/**
 * GET /api/admin/upload
 * List all uploaded media files.
 */
export const GET = withErrorHandling(async () => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const { getStorageBackend } = await import('@/lib/cloud-storage')
  const backend = getStorageBackend()

  if (backend === 'cloudinary') {
    // Cloudinary: return in-memory store (or fetch from Cloudinary API)
    return jsonResponse({ data: mediaStore, backend })
  }

  // Local: scan the uploads directory
  try {
    const entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true })
    const files: MediaFile[] = []
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const full = path.join(UPLOAD_DIR, entry.name)
      const stat = await fs.stat(full)
      files.push({
        filename: entry.name,
        url: `/uploads/${entry.name}`,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
      })
    }
    // Merge with in-memory entries
    const known = new Set(files.map((f) => f.filename))
    for (const m of mediaStore) {
      if (!known.has(m.filename)) files.push(m)
    }
    return jsonResponse({ data: files, backend })
  } catch {
    return jsonResponse({ data: [], backend })
  }
})

/**
 * POST /api/admin/upload
 * Upload one or more files (multipart/form-data, field name "file").
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const formData = await request.formData()
  const allFiles = formData.getAll('file')
  if (allFiles.length === 0) return errorResponse('No file provided', 400)

  const uploaded: MediaFile[] = []
  for (const entry of allFiles) {
    if (!(entry instanceof File)) continue
    try {
      const result = await uploadFile(entry, 'general')
      const media: MediaFile = {
        filename: entry.name,
        url: result.url,
        size: result.bytes,
        createdAt: new Date().toISOString(),
        publicId: result.publicId,
      }
      mediaStore.push(media)
      uploaded.push(media)
    } catch (err: any) {
      console.error('[upload] File upload failed:', err?.message)
      // Continue with remaining files
    }
  }

  if (uploaded.length === 0) {
    return errorResponse('No valid file uploaded', 400)
  }

  return jsonResponse({
    url: uploaded[0].url,
    data: uploaded,
    message: `${uploaded.length} file(s) uploaded`,
  }, 201)
})
