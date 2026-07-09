import { NextRequest } from 'next/server'
import { requireAdmin, jsonResponse, errorResponse } from '@/lib/admin-api'
import { uploadFile } from '@/lib/cloud-storage'
import { promises as fs } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response!

    const { searchParams } = new URL(req.url)
    const folder = searchParams.get('folder') || ''

    const targetDir = folder ? path.join(UPLOAD_DIR, folder) : UPLOAD_DIR
    let entries: string[]
    try {
      entries = await fs.readdir(targetDir)
    } catch {
      // Directory doesn't exist yet — return empty list
      return jsonResponse({ data: [] })
    }

    const files = []
    for (const name of entries) {
      const filePath = path.join(targetDir, name)
      const stat = await fs.stat(filePath)
      if (!stat.isFile()) continue
      files.push({
        filename: name,
        url: `/uploads/${folder ? folder + '/' : ''}${name}`,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
      })
    }

    // Sort newest first
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return jsonResponse({ data: files })
  } catch (err: any) {
    console.error('[Upload GET] Error:', err)
    return errorResponse(err.message || 'Failed to list files', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.response!

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return errorResponse('No file provided', 400)
    }

    // Determine folder from optional query param, default to "general"
    const { searchParams } = new URL(req.url)
    const folder = searchParams.get('folder') || 'general'

    const result = await uploadFile(file, folder)

    return jsonResponse({ data: { url: result.url } })
  } catch (err: any) {
    console.error('[Upload] Error:', err)
    return errorResponse(err.message || 'Upload failed', 500)
  }
}