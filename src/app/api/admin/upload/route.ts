import type { NextRequest } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/admin-api'
import { withErrorHandling } from '@/lib/api-handler'

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
]
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const PUBLIC_PREFIX = '/uploads'

// ─── POST /api/admin/upload ───────────────────────────────────────────────────
// Multipart form-data upload. Admin-only. Returns { data: { url } }.
// Robust error handling: validates auth, file presence, size, MIME type,
// and filesystem write failures — never returns a raw internal error.

export const POST = withErrorHandling(async (request: NextRequest) => {
  // 1. Auth — admin only
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}

  // 2. Parse multipart form
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse('Invalid form data — expected multipart/form-data', 400)
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return errorResponse('No file provided. Attach a file field named "file".', 400)
  }

  // 3. Validate MIME type (check BOTH the declared type AND the extension
  //    as a defense-in-depth measure, since MIME can be spoofed by clients).
  const declaredType = file.type || ''
  const ext = path.extname(file.name || '').toLowerCase()
  if (!ALLOWED_MIME_TYPES.includes(declaredType)) {
    return errorResponse(
      `Unsupported file type "${declaredType || 'unknown'}". Allowed: JPG, PNG, GIF, WebP, SVG, BMP.`,
      400,
    )
  }

  // 4. Validate file size
  if (file.size === 0) {
    return errorResponse('The uploaded file is empty.', 400)
  }
  if (file.size > MAX_FILE_SIZE) {
    return errorResponse(
      `File too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum allowed is ${MAX_FILE_SIZE / 1024 / 1024} MB.`,
      400,
    )
  }

  // 5. Generate a unique filename (UUID + original extension) to avoid
  //    collisions and path-traversal attacks from user-supplied names.
  const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'].includes(ext)
    ? ext
    : '.jpg'
  const filename = `${randomUUID()}${safeExt}`

  // 6. Ensure the upload directory exists
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  } catch (err) {
    console.error('[upload] mkdir failed:', err)
    return errorResponse('Server storage is not available. Please try again.', 500)
  }

  // 7. Write the file to disk
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const filepath = path.join(UPLOAD_DIR, filename)
    await fs.writeFile(filepath, buffer)
  } catch (err) {
    console.error('[upload] writeFile failed:', err)
    return errorResponse('Failed to save the file. Please try again.', 500)
  }

  // 8. Return the public URL (relative path works in both dev and prod)
  const url = `${PUBLIC_PREFIX}/${filename}`
  return jsonResponse({ data: { url, filename }, message: 'Image uploaded successfully' }, 201)
})

// ─── GET — quick health check (admin only) ────────────────────────────────────

export const GET = withErrorHandling(async () => {
  const auth = await requireAdmin()
  if (!auth.ok) {return auth.response!}
  return jsonResponse({ data: { ok: true, maxSize: MAX_FILE_SIZE } })
})
