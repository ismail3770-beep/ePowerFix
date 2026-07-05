/**
 * Cloud Storage Abstraction Layer
 *
 * Default backend: local filesystem (public/uploads/), served at /uploads/.
 *
 * Cloudinary support: removed to avoid a hard dependency on the `cloudinary`
 * package (which produced "Module not found" build warnings). To re-enable
 * Cloudinary later: `bun add cloudinary`, set CLOUDINARY_* env vars, and
 * re-add the uploadToCloudinary() path. The local backend is fully
 * functional for dev and small-scale prod.
 *
 * Usage:
 *   import { uploadFile } from '@/lib/cloud-storage'
 *
 *   const result = await uploadFile(file, 'products')
 *   // result.url = "/uploads/products/xxx.jpg"
 */

import { promises as fs } from 'fs'
import path from 'path'

// --- Types -------------------------------------------------------------------

export interface UploadResult {
  url: string
  publicId?: string
  bytes: number
  format: string
}

// --- Configuration -----------------------------------------------------------

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/avif', 'image/svg+xml',
  'application/pdf',
]

// --- Validation --------------------------------------------------------------

export function validateFile(file: File): { ok: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: `File type ${file.type} not allowed` }
  }
  return { ok: true }
}

// --- Local Upload ------------------------------------------------------------

async function uploadToLocal(file: File, folder: string): Promise<UploadResult> {
  const dir = path.join(UPLOAD_DIR, folder)
  await fs.mkdir(dir, { recursive: true })

  const ext = path.extname(file.name) || `.${file.type.split('/')[1] || 'jpg'}`
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  const dest = path.join(dir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(dest, buffer)

  return {
    url: `/uploads/${folder}/${filename}`,
    bytes: buffer.length,
    format: ext.slice(1),
  }
}

// --- Delete ------------------------------------------------------------------

export async function deleteFile(url: string, _publicId?: string): Promise<void> {
  if (url.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', url)
    await fs.unlink(filePath).catch(() => {})
  }
}

// --- Main Upload Function ----------------------------------------------------

/**
 * Upload a file to local storage.
 *
 * @param file — The File object from FormData
 * @param folder — Subfolder name (e.g., 'products', 'banners', 'blog')
 * @returns UploadResult with URL
 */
export async function uploadFile(file: File, folder: string = 'general'): Promise<UploadResult> {
  const validation = validateFile(file)
  if (!validation.ok) {
    throw new Error(validation.error!)
  }

  return uploadToLocal(file, folder)
}

/**
 * Check if cloud storage is configured.
 * Returns false (local-only) unless a cloud backend is added.
 */
export function isCloudStorageConfigured(): boolean {
  return false
}

/**
 * Get the storage backend name for health checks.
 */
export function getStorageBackend(): string {
  return 'local'
}
