/**
 * Cloud Storage Abstraction Layer
 *
 * Supports two backends:
 *  - Cloudinary (if CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME is set)
 *  - Local filesystem fallback (public/uploads/)
 *
 * Usage:
 *   import { uploadFile } from '@/lib/cloud-storage'
 *
 *   const result = await uploadFile(file, 'products')
 *   // result.url = "https://res.cloudinary.com/..." or "/uploads/xxx.jpg"
 *
 * Setup:
 *   Option A — Cloudinary (recommended for production):
 *     1. bun add cloudinary
 *     2. Add to .env:
 *        CLOUDINARY_CLOUD_NAME=your_cloud_name
 *        CLOUDINARY_API_KEY=your_api_key
 *        CLOUDINARY_API_SECRET=your_api_secret
 *
 *   Option B — Local (dev/CI, no setup needed):
 *     Files saved to public/uploads/, served at /uploads/
 */

import { promises as fs } from 'fs'
import path from 'path'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string
  publicId?: string
  bytes: number
  format: string
}

// ─── Configuration ────────────────────────────────────────────────────────────

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || ''
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || ''
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || ''
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'image/avif', 'image/svg+xml',
  'application/pdf',
]

function isCloudinaryConfigured(): boolean {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET)
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateFile(file: File): { ok: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: `File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: `File type ${file.type} not allowed` }
  }
  return { ok: true }
}

// ─── Cloudinary Upload ────────────────────────────────────────────────────────

async function uploadToCloudinary(file: File, folder: string): Promise<UploadResult> {
  // Lazy import — only loads cloudinary when actually needed
  const cloudinary = await import('cloudinary').then((m) => m.v2 || m.default?.v2 || m.default)

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  })

  const buffer = Buffer.from(await file.arrayBuffer())
  const publicId = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: publicId,
        folder: `epowerfix/${folder}`,
        unique_filename: true,
        overwrite: false,
      },
      (error: any, result: any) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`))
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            bytes: result.bytes,
            format: result.format,
          })
        }
      },
    )
    uploadStream.end(buffer)
  })
}

// ─── Local Upload ─────────────────────────────────────────────────────────────

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

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteFile(url: string, publicId?: string): Promise<void> {
  if (publicId && isCloudinaryConfigured()) {
    try {
      const cloudinary = await import('cloudinary').then((m) => m.v2 || m.default?.v2 || m.default)
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
      })
      await cloudinary.uploader.destroy(publicId)
    } catch (err: any) {
      console.warn('[cloud-storage] Delete failed:', err?.message)
    }
  } else if (url.startsWith('/uploads/')) {
    // Local delete
    const filePath = path.join(process.cwd(), 'public', url)
    await fs.unlink(filePath).catch(() => {})
  }
}

// ─── Main Upload Function ─────────────────────────────────────────────────────

/**
 * Upload a file to cloud storage (Cloudinary) or local filesystem.
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

  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(file, folder)
  }

  return uploadToLocal(file, folder)
}

/**
 * Check if cloud storage is configured.
 */
export function isCloudStorageConfigured(): boolean {
  return isCloudinaryConfigured()
}

/**
 * Get the storage backend name for health checks.
 */
export function getStorageBackend(): string {
  return isCloudinaryConfigured() ? 'cloudinary' : 'local'
}
