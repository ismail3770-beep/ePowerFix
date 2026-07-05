import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/auth'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

// In-memory metadata store (resets on server restart). For production you'd
// persist this to the database, but for now this is enough for the media
// library UI to list uploaded files.
type MediaFile = {
  filename: string
  url: string
  size: number
  createdAt: string
}

const mediaStore: MediaFile[] = []

async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  } catch {
    // directory may already exist
  }
}

async function listUploadedFiles(): Promise<MediaFile[]> {
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
    // Merge with any in-memory entries (defensive — in case files exist only
    // in memory during the current process lifetime).
    const known = new Set(files.map((f) => f.filename))
    for (const m of mediaStore) {
      if (!known.has(m.filename)) files.push(m)
    }
    return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } catch {
    return [...mediaStore]
  }
}

/**
 * GET /api/admin/upload
 * List all uploaded media files.
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  const files = await listUploadedFiles()
  return jsonResponse({ data: files })
}

/**
 * POST /api/admin/upload
 * Upload one or more files (multipart/form-data, field name "file").
 * Returns { url } for the first file (profile avatar flow) and { data: [...] }
 * for the media library flow.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    await ensureUploadDir()
    const formData = await request.formData()
    const allFiles = formData.getAll('file')
    if (allFiles.length === 0) return errorResponse('No file provided', 400)

    const uploaded: MediaFile[] = []
    for (const entry of allFiles) {
      if (!(entry instanceof File)) continue
      const ext = path.extname(entry.name) || ''
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
      const dest = path.join(UPLOAD_DIR, safeName)
      const buffer = Buffer.from(await entry.arrayBuffer())
      await fs.writeFile(dest, buffer)
      const media: MediaFile = {
        filename: safeName,
        url: `/uploads/${safeName}`,
        size: buffer.length,
        createdAt: new Date().toISOString(),
      }
      mediaStore.push(media)
      uploaded.push(media)
    }

    if (uploaded.length === 0) return errorResponse('No valid file uploaded', 400)

    // Profile avatar flow expects { url } at the top level.
    return jsonResponse({
      url: uploaded[0].url,
      data: uploaded,
      message: `${uploaded.length} file(s) uploaded`,
    }, 201)
  } catch (err: any) {
    console.error('admin/upload POST error:', err)
    return errorResponse(err?.message || 'Upload failed', 500)
  }
}
