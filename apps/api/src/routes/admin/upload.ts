// Admin upload routes: file upload (multipart), health check, delete by filename.
// Mounted at /api/admin/upload
//
// Upload strategy:
//   - If CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET are set → upload to Cloudinary
//   - Otherwise → save to local UPLOAD_DIR (development fallback)
//
// Multipart parsing uses the busboy package (already available transitively via
// formidable-like logic) — implemented here with Node's built-in stream APIs so
// no additional dependency is required beyond what Express already pulls in.

import { Router } from 'express'
import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { asyncHandler, ApiError } from '../../lib/api-handler.js'
import { env } from '../../config/env.js'

const router = Router()

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads')
const PUBLIC_PREFIX = process.env.PUBLIC_UPLOAD_PREFIX || '/uploads'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
  'image/avif', 'image/svg+xml',
])

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parses a multipart/form-data request body and extracts the first file field.
 * Returns { buffer, filename, mimeType } or throws if no file is found.
 * Uses raw Node stream/boundary parsing — no external dependency needed.
 */
async function parseMultipartFile(
  req: any,
): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
  const contentType: string = req.headers['content-type'] || ''
  if (!contentType.includes('multipart/form-data')) {
    throw new ApiError('Content-Type must be multipart/form-data', 400)
  }

  const boundaryMatch = contentType.match(/boundary=([^\s;]+)/)
  if (!boundaryMatch) {
    throw new ApiError('Missing multipart boundary', 400)
  }
  const boundary = boundaryMatch[1].replace(/^"/, '').replace(/"$/, '')

  // Collect the raw body
  const chunks: Buffer[] = []
  let totalSize = 0
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: Buffer) => {
      totalSize += chunk.length
      if (totalSize > MAX_FILE_SIZE) {
        reject(new ApiError(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`, 413))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', resolve)
    req.on('error', reject)
  })

  const body = Buffer.concat(chunks)
  const boundaryBuf = Buffer.from(`--${boundary}`)
  const crlf = Buffer.from('\r\n')
  const crlfcrlf = Buffer.from('\r\n\r\n')

  // Split on boundary
  let pos = 0
  while (pos < body.length) {
    const bStart = indexOf(body, boundaryBuf, pos)
    if (bStart === -1) break
    pos = bStart + boundaryBuf.length

    // Skip trailing -- (final boundary)
    if (body[pos] === 0x2d && body[pos + 1] === 0x2d) break

    // Skip CRLF after boundary
    if (body[pos] === 0x0d && body[pos + 1] === 0x0a) pos += 2

    // Find end of headers
    const headerEnd = indexOf(body, crlfcrlf, pos)
    if (headerEnd === -1) break
    const headerSection = body.slice(pos, headerEnd).toString('utf8')
    pos = headerEnd + 4

    // Find next boundary start
    const nextBoundary = indexOf(body, Buffer.from(`\r\n--${boundary}`), pos)
    const fileEnd = nextBoundary === -1 ? body.length : nextBoundary
    const fileBuffer = body.slice(pos, fileEnd)
    pos = fileEnd

    // Parse Content-Disposition
    const dispositionMatch = headerSection.match(
      /Content-Disposition:[^\r\n]*name="([^"]*)"(?:[^\r\n]*filename="([^"]*)")?/i,
    )
    if (!dispositionMatch) continue

    const fieldName = dispositionMatch[1]
    const originalFilename = dispositionMatch[2] || 'upload'

    // Only handle the "file" field
    if (fieldName !== 'file') continue

    const mimeMatch = headerSection.match(/Content-Type:\s*([^\r\n]+)/i)
    const mimeType = (mimeMatch?.[1] || 'application/octet-stream').trim()

    return { buffer: fileBuffer, filename: originalFilename, mimeType }
  }

  throw new ApiError('No file field found in the multipart body', 400)
}

/** Buffer indexOf helper (not available on Node Buffer natively with offset for sub-buffers). */
function indexOf(haystack: Buffer, needle: Buffer, offset = 0): number {
  for (let i = offset; i <= haystack.length - needle.length; i++) {
    let found = true
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) { found = false; break }
    }
    if (found) return i
  }
  return -1
}

/**
 * Uploads a file buffer to Cloudinary using the signed upload REST API.
 * Returns the secure URL of the uploaded asset.
 */
async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  mimeType: string,
): Promise<string> {
  const cloudName = env.CLOUDINARY_CLOUD_NAME!
  const apiKey = env.CLOUDINARY_API_KEY!
  const apiSecret = env.CLOUDINARY_API_SECRET!

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
  const signature = createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex')

  // Build multipart form for Cloudinary
  const formBoundary = `epf-${Date.now()}`
  const parts: Buffer[] = []
  const enc = (s: string) => Buffer.from(s, 'utf8')
  const line = (s: string) => Buffer.from(s + '\r\n', 'utf8')

  const addField = (name: string, value: string) => {
    parts.push(
      line(`--${formBoundary}`),
      line(`Content-Disposition: form-data; name="${name}"`),
      line(''),
      enc(value),
      line(''),
    )
  }

  addField('api_key', apiKey)
  addField('timestamp', timestamp)
  addField('folder', folder)
  addField('signature', signature)

  // File part
  parts.push(
    line(`--${formBoundary}`),
    line(`Content-Disposition: form-data; name="file"; filename="upload"`),
    line(`Content-Type: ${mimeType}`),
    line(''),
    buffer,
    line(''),
    enc(`--${formBoundary}--`),
  )

  const formBody = Buffer.concat(parts)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${formBoundary}` },
      body: formBody,
    },
  )

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new ApiError(`Cloudinary upload failed: ${response.status} ${text}`, 502)
  }

  const data = (await response.json()) as { secure_url?: string; error?: { message: string } }
  if (data.error) throw new ApiError(`Cloudinary error: ${data.error.message}`, 502)
  if (!data.secure_url) throw new ApiError('Cloudinary did not return a URL', 502)

  return data.secure_url
}

/**
 * Saves a buffer to local disk and returns the public URL path.
 * Used as fallback when Cloudinary is not configured.
 */
async function uploadToLocalDisk(
  buffer: Buffer,
  originalFilename: string,
  folder: string,
): Promise<string> {
  const safeExt = path.extname(originalFilename).replace(/[^.a-zA-Z0-9]/g, '') || '.bin'
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`
  const uploadFolder = path.join(UPLOAD_DIR, folder)
  await fs.mkdir(uploadFolder, { recursive: true })
  const filePath = path.join(uploadFolder, uniqueName)
  await fs.writeFile(filePath, buffer)
  return `${PUBLIC_PREFIX}/${folder}/${uniqueName}`
}

// ─── GET /api/admin/upload (health check) ────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const cloudinaryConfigured = !!(
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    )
    res.json({
      data: { ok: true, maxSize: MAX_FILE_SIZE, backend: cloudinaryConfigured ? 'cloudinary' : 'local' },
    })
  }),
)

// ─── POST /api/admin/upload ───────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { buffer, filename, mimeType } = await parseMultipartFile(req)

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new ApiError(
        `Unsupported file type: ${mimeType}. Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
        415,
      )
    }

    const folder = (req.query.folder as string) || 'epowerfix'
    const cloudinaryConfigured = !!(
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    )

    let url: string
    if (cloudinaryConfigured) {
      url = await uploadToCloudinary(buffer, folder, mimeType)
    } else {
      url = await uploadToLocalDisk(buffer, filename, folder)
    }

    res.status(201).json({ data: { url } })
  }),
)

// ─── DELETE /api/admin/upload/:filename ──────────────────────────────────────

router.delete(
  '/:filename',
  asyncHandler(async (req, res) => {
    const filename = String(req.params.filename || '')

    // Path traversal protection
    if (
      !filename ||
      filename.includes('..') ||
      filename.startsWith('/') ||
      filename.includes('\\')
    ) {
      throw new ApiError('Invalid filename', 400)
    }

    const targetPath = path.join(UPLOAD_DIR, filename)

    // First try the direct path
    try {
      await fs.access(targetPath)
      await fs.unlink(targetPath)
      return res.json({ data: { deleted: true } })
    } catch {
      // Not found at root level — search subdirectories
    }

    // Search in subdirectories
    let found = false
    const folders = await fs.readdir(UPLOAD_DIR).catch(() => [] as string[])
    for (const folder of folders) {
      const folderPath = path.join(UPLOAD_DIR, folder)
      const stat = await fs.stat(folderPath).catch(() => null)
      if (!stat || !stat.isDirectory()) continue

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
      throw new ApiError('File not found', 404)
    }

    res.json({ data: { deleted: true } })
  }),
)

export default router
