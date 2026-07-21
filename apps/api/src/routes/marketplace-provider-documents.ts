import express, { Router } from 'express'

import { ApiError, asyncHandler } from '../lib/api-handler.js'
import { requireAuth } from '../lib/auth.js'
import { db } from '../lib/db.js'
import {
  getMarketplaceProvider,
  requireProvider,
  requireProviderOnboardingEnabled,
} from '../lib/marketplace-auth.js'
import { REQUIRED_PROVIDER_DOCUMENT_TYPES } from '../lib/marketplace-provider.js'
import {
  MAX_PROVIDER_DOCUMENT_BYTES,
  providerDocumentMimeFromKey,
  readProviderDocument,
  removeProviderDocument,
  saveProviderDocument,
} from '../lib/provider-document-storage.js'

const router = Router()
const documentTypes = new Set<string>(REQUIRED_PROVIDER_DOCUMENT_TYPES)
const uploadParser = express.raw({
  type: ['application/octet-stream', 'application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  limit: MAX_PROVIDER_DOCUMENT_BYTES,
})

router.put(
  '/:type/file',
  requireProviderOnboardingEnabled,
  requireAuth,
  requireProvider,
  uploadParser,
  asyncHandler(async (req, res) => {
    const provider = getMarketplaceProvider(req)
    if (!['DRAFT', 'REJECTED'].includes(provider.status)) {
      throw new ApiError('Documents can only be changed before profile verification', 409)
    }
    const type = String(req.params.type).toUpperCase()
    if (!documentTypes.has(type)) throw new ApiError('Unsupported provider document type', 400)
    if (!Buffer.isBuffer(req.body)) throw new ApiError('A document file is required', 400)

    const declaredMime = req.headers['x-file-type']
      ? String(req.headers['x-file-type'])
      : String(req.headers['content-type'] || '')

    let saved: { storageKey: string; mime: string }
    try {
      saved = await saveProviderDocument({ data: req.body, providerId: provider.id, type, mime: declaredMime })
    } catch (error) {
      throw new ApiError(error instanceof Error ? error.message : 'Document upload failed', 400)
    }

    const previous = await db.providerDocument.findUnique({
      where: { providerId_type: { providerId: provider.id, type } },
      select: { storageKey: true },
    })

    try {
      const document = await db.$transaction(async (tx) => {
        const result = await tx.providerDocument.upsert({
          where: { providerId_type: { providerId: provider.id, type } },
          create: { providerId: provider.id, type, storageKey: saved.storageKey },
          update: {
            storageKey: saved.storageKey,
            status: 'PENDING',
            rejectionReason: null,
            reviewedById: null,
            reviewedAt: null,
          },
          select: {
            id: true,
            type: true,
            status: true,
            rejectionReason: true,
            expiresAt: true,
            createdAt: true,
            updatedAt: true,
          },
        })
        await tx.marketplaceAuditEvent.create({
          data: {
            actorUserId: provider.userId,
            providerId: provider.id,
            entityType: 'PROVIDER_DOCUMENT',
            entityId: result.id,
            action: previous ? 'REPLACED' : 'UPLOADED',
            metadata: JSON.stringify({ type, mime: saved.mime }),
          },
        })
        return result
      })
      if (previous?.storageKey && previous.storageKey !== saved.storageKey) {
        await removeProviderDocument(previous.storageKey).catch(() => undefined)
      }
      res.json({ data: document })
    } catch (error) {
      await removeProviderDocument(saved.storageKey).catch(() => undefined)
      throw error
    }
  }),
)

router.get(
  '/:documentId/file',
  requireAuth,
  requireProvider,
  asyncHandler(async (req, res) => {
    const provider = getMarketplaceProvider(req)
    const document = await db.providerDocument.findFirst({
      where: { id: String(req.params.documentId), providerId: provider.id },
      select: { storageKey: true, type: true },
    })
    if (!document) throw new ApiError('Provider document not found', 404)
    try {
      const data = await readProviderDocument(document.storageKey)
      res.setHeader('Content-Type', providerDocumentMimeFromKey(document.storageKey))
      res.setHeader('Content-Disposition', `inline; filename="${document.type.toLowerCase()}"`)
      res.setHeader('Cache-Control', 'private, no-store')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.send(data)
    } catch {
      throw new ApiError('Stored provider document is unavailable', 404)
    }
  }),
)

export default router
