import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { env } from '../config/env.js'

export const MAX_PROVIDER_DOCUMENT_BYTES = 8 * 1024 * 1024

const FILE_TYPES = {
  'image/jpeg': {
    extension: '.jpg',
    matches: (data: Buffer) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff,
  },
  'image/png': {
    extension: '.png',
    matches: (data: Buffer) => data.length >= 8
      && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    extension: '.webp',
    matches: (data: Buffer) => data.length >= 12
      && data.subarray(0, 4).toString('ascii') === 'RIFF'
      && data.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  'application/pdf': {
    extension: '.pdf',
    matches: (data: Buffer) => data.length >= 5 && data.subarray(0, 5).toString('ascii') === '%PDF-',
  },
} as const

export type ProviderDocumentMime = keyof typeof FILE_TYPES

function storageRoot(): string {
  return path.resolve(env.PRIVATE_UPLOAD_DIR)
}

function safeStoragePath(storageKey: string): string {
  if (!storageKey || storageKey.includes('..') || storageKey.includes('\\') || path.isAbsolute(storageKey)) {
    throw new Error('Invalid private storage key')
  }
  const root = storageRoot()
  const resolved = path.resolve(root, ...storageKey.split('/'))
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error('Private storage key escapes the configured root')
  }
  return resolved
}

export function validateProviderDocument(data: Buffer, mime: string): ProviderDocumentMime {
  if (data.length === 0) throw new Error('Document file is empty')
  if (data.length > MAX_PROVIDER_DOCUMENT_BYTES) throw new Error('Document exceeds the 8 MB limit')
  const normalized = mime.split(';', 1)[0]?.trim().toLowerCase() as ProviderDocumentMime
  const definition = FILE_TYPES[normalized]
  if (!definition || !definition.matches(data)) {
    throw new Error('Document must be a valid JPEG, PNG, WebP, or PDF file')
  }
  return normalized
}

export async function saveProviderDocument(input: {
  data: Buffer
  providerId: string
  type: string
  mime: string
}): Promise<{ storageKey: string; mime: ProviderDocumentMime }> {
  const mime = validateProviderDocument(input.data, input.mime)
  const extension = FILE_TYPES[mime].extension
  const storageKey = `marketplace/providers/${input.providerId}/${input.type.toLowerCase()}/${randomUUID()}${extension}`
  const target = safeStoragePath(storageKey)
  const temporary = `${target}.${randomUUID()}.tmp`
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(temporary, input.data, { flag: 'wx' })
  await rename(temporary, target)
  return { storageKey, mime }
}

export async function readProviderDocument(storageKey: string): Promise<Buffer> {
  return readFile(safeStoragePath(storageKey))
}

export async function removeProviderDocument(storageKey: string): Promise<void> {
  await rm(safeStoragePath(storageKey), { force: true })
}

export function providerDocumentMimeFromKey(storageKey: string): ProviderDocumentMime {
  const extension = path.extname(storageKey).toLowerCase()
  const found = Object.entries(FILE_TYPES).find(([, value]) => value.extension === extension)
  if (!found) throw new Error('Unsupported stored document type')
  return found[0] as ProviderDocumentMime
}
