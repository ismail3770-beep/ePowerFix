import { NextRequest } from 'next/server'
import {
  requireAdmin,
  jsonResponse,
  errorResponse,
  parseBody,
} from '@/lib/admin-api'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

/**
 * Decodes a base64 data URL into a Buffer and infers the file extension from
 * the MIME type. Returns null if the data URL is invalid.
 */
function decodeDataUrl(dataUrl: string): { buffer: Buffer; ext: string } | null {
  const match = dataUrl.match(/^data:([\w/+.-]+);base64,(.*)$/)
  if (!match) return null

  const mime = match[1]
  const base64 = match[2]
  const buffer = Buffer.from(base64, 'base64')

  const extByMime: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/x-icon': 'ico',
  }

  const ext = extByMime[mime] || mime.split('/')[1]?.replace('svg+xml', 'svg') || 'bin'
  return { buffer, ext }
}

/**
 * Sanitizes a user-supplied filename for safe filesystem usage.
 */
function sanitizeFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '-')
  return base.length > 60 ? base.slice(-60) : base
}

/**
 * POST /api/admin/upload/[filename]
 * Accepts EITHER:
 *  - multipart/form-data with a `file` field (recommended)
 *  - JSON body { image: 'data:image/...' }  (base64 data URL)
 *  - JSON body { base64: '<raw base64>', mimeType?: 'image/png' }
 *
 * Saves the file to /public/uploads/<unique>-<filename>.<ext> and returns
 * { data: { url: '/uploads/<filename>' } }.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response!

  try {
    const { filename: requestedName } = await params

    // Ensure the uploads directory exists.
    await fs.mkdir(UPLOAD_DIR, { recursive: true })

    let buffer: Buffer
    let ext = 'bin'

    const contentType = (request.headers.get('content-type') || '').toLowerCase()

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (!file) return errorResponse('No "file" field in form data', 400)

      const arr = await file.arrayBuffer()
      buffer = Buffer.from(arr)

      // Infer extension from the original file name or MIME.
      const originalName = file.name || requestedName || 'upload'
      const parsed = path.extname(originalName).toLowerCase().replace(/^\./, '')
      if (parsed) {
        ext = parsed
      } else if (file.type) {
        ext = file.type.split('/')[1]?.replace('svg+xml', 'svg') || 'bin'
      }
    } else {
      // JSON body — supports { image: 'data:...' } or { base64, mimeType }.
      const body = await parseBody<any>(request)
      if (!body) return errorResponse('Invalid request body', 400)

      if (body.image && typeof body.image === 'string') {
        const decoded = decodeDataUrl(body.image)
        if (!decoded) return errorResponse('Invalid base64 data URL', 400)
        buffer = decoded.buffer
        ext = decoded.ext
      } else if (body.base64 && typeof body.base64 === 'string') {
        buffer = Buffer.from(body.base64, 'base64')
        ext = body.mimeType
          ? body.mimeType.split('/')[1]?.replace('svg+xml', 'svg') || 'bin'
          : 'bin'
      } else {
        return errorResponse(
          'Request body must contain `image` (data URL) or `base64`+`mimeType`',
          400
        )
      }
    }

    // Build a unique filename. Use the requested name if present, sanitized;
    // otherwise fall back to a generic name.
    const baseName = sanitizeFilename(requestedName || `upload-${Date.now()}`)
    const hasExtInName = path.extname(baseName).length > 0
    const finalName = hasExtInName
      ? `${Date.now()}-${baseName}`
      : `${Date.now()}-${baseName}.${ext}`
    const fullPath = path.join(UPLOAD_DIR, finalName)

    // Write to disk.
    await fs.writeFile(fullPath, buffer)

    const url = `/uploads/${finalName}`
    return jsonResponse(
      {
        data: {
          url,
          filename: finalName,
          size: buffer.length,
        },
      },
      201
    )
  } catch (err: any) {
    console.error('admin/upload POST error:', err)
    return errorResponse(err?.message || 'Internal server error', 500)
  }
}
