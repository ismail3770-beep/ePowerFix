// Admin upload routes: file upload (multipart), get (health check), delete by filename.
// Migrated from:
//   apps/web/src/app/api/admin/upload/route.ts          (POST multipart upload + GET health)
//   apps/web/src/app/api/admin/upload/[filename]/route.ts (DELETE)
//
// Mounted at /api/admin/upload
//
// NOTE: The Next.js source uses native multipart/form-data via `request.formData()`.
// Express does not have a built-in multipart parser. A proper implementation
// requires an external middleware (multer, formidable, etc.) which is not yet
// installed in this project. The POST endpoint therefore returns 501 with a
// helpful message until a multipart middleware is wired up.
//
// To enable: install multer, add `upload.single('file')` middleware on the
// POST route, then read `req.file` instead of `formData.get('file')`.

import { Router } from 'express'
import { promises as fs } from 'fs'
import path from 'path'

import { asyncHandler, ApiError } from '../../lib/api-handler.js'

const router = Router()

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads')
const PUBLIC_PREFIX = '/uploads'

// ─── GET /api/admin/upload (health check) ────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ data: { ok: true, maxSize: MAX_FILE_SIZE } })
  })
)

// ─── POST /api/admin/upload ──────────────────────────────────────────────────
// Returns 501 until a multipart middleware (e.g. multer) is installed.

router.post(
  '/',
  asyncHandler(async (_req, res) => {
    res.status(501).json({
      error:
        'Multipart upload not yet configured. Install multer and wire up upload.single("file") on this route.',
    })
  })
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
  })
)

export default router
