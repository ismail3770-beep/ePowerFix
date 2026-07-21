// Authenticated persisted-cart routes. Guest carts remain client-side and are
// merged into this cart after login by the web and mobile clients.

import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler, ApiError, validateBody } from '../lib/api-handler.js'
import { requireAuth, getAuthUser } from '../lib/auth.js'
import { db } from '../lib/db.js'
import { parseJsonField } from '../lib/helpers.js'

const router = Router()

const productCartItemSchema = z.object({
  itemType: z.literal('PRODUCT'),
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  quantity: z.number().int().min(1).max(99),
}).strict()

const serviceCartItemSchema = z.object({
  itemType: z.literal('SERVICE'),
  serviceId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
}).strict()

const projectCartItemSchema = z.object({
  itemType: z.literal('PROJECT'),
  projectId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
}).strict()

const projectKitCartItemSchema = z.object({
  itemType: z.literal('PROJECT_KIT'),
  projectKitId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
}).strict()

const replaceCartSchema = z.object({
  items: z.array(z.discriminatedUnion('itemType', [
    productCartItemSchema,
    serviceCartItemSchema,
    projectCartItemSchema,
    projectKitCartItemSchema,
  ])).max(100),
}).strict()

type CartInput = z.infer<typeof replaceCartSchema>['items'][number]

type PersistedCartItem = {
  id: string
  itemType: 'PRODUCT' | 'SERVICE' | 'PROJECT' | 'PROJECT_KIT'
  productId?: string
  serviceId?: string
  projectId?: string
  projectKitId?: string
  variantId?: string
  variantLabel?: string
  productName: string
  productImage: string
  price: number
  quantity: number
}

const cartItemInclude = {
  product: true,
  variant: true,
  service: true,
  project: true,
  projectKit: true,
} as const

function firstImage(images: unknown): string {
  return parseJsonField<string>(images)[0] ?? ''
}

function formatCartItem(item: any): PersistedCartItem | null {
  if (item.itemType === 'SERVICE') {
    const service = item.service
    if (!service || !service.isActive || service.isDeleted) return null
    return {
      id: item.id,
      itemType: 'SERVICE',
      serviceId: service.id,
      productName: service.nameBn || service.name,
      productImage: firstImage(service.images),
      price: service.basePrice,
      quantity: item.quantity,
    }
  }

  if (item.itemType === 'PROJECT') {
    const project = item.project
    if (!project || project.isDeleted || !project.isSellable || project.price === null) return null
    return {
      id: item.id,
      itemType: 'PROJECT',
      projectId: project.id,
      productName: project.titleBn || project.title,
      productImage: project.coverImage || firstImage(project.images),
      price: project.salePrice ?? project.price,
      quantity: item.quantity,
    }
  }

  if (item.itemType === 'PROJECT_KIT') {
    const kit = item.projectKit
    if (!kit || !kit.isActive || kit.isDeleted) return null
    return {
      id: item.id,
      itemType: 'PROJECT_KIT',
      projectKitId: kit.id,
      productName: kit.titleBn || kit.title,
      productImage: kit.coverImage || firstImage(kit.images),
      price: kit.salePrice ?? kit.price,
      quantity: item.quantity,
    }
  }

  const product = item.product
  const variant = item.variant
  if (!product || !product.isActive || product.isDeleted) return null
  if (item.variantId && (!variant || !variant.isActive || variant.productId !== product.id)) return null

  return {
    id: item.id,
    itemType: 'PRODUCT',
    productId: product.id,
    ...(variant ? { variantId: variant.id, variantLabel: variant.name } : {}),
    productName: product.nameBn || product.name,
    productImage: firstImage(product.images),
    price: variant ? (variant.salePrice ?? variant.price) : (product.salePrice ?? product.price),
    quantity: item.quantity,
  }
}

function cartIdentity(item: CartInput): string {
  if (item.itemType === 'SERVICE') return `SERVICE:${item.serviceId}`
  if (item.itemType === 'PROJECT') return `PROJECT:${item.projectId}`
  if (item.itemType === 'PROJECT_KIT') return `PROJECT_KIT:${item.projectKitId}`
  return `PRODUCT:${item.productId}:${item.variantId ?? ''}`
}

function deduplicateCart(items: CartInput[]): CartInput[] {
  const deduplicated = new Map<string, CartInput>()
  for (const item of items) {
    const key = cartIdentity(item)
    const existing = deduplicated.get(key)
    deduplicated.set(key, existing
      ? { ...existing, quantity: Math.min(99, existing.quantity + item.quantity) }
      : item)
  }
  return [...deduplicated.values()]
}

async function lockUserCart(tx: any, userId: string): Promise<void> {
  const lock = await tx.user.updateMany({
    where: { id: userId },
    data: { updatedAt: new Date() },
  })
  if (lock.count !== 1) throw new ApiError('User session is no longer valid', 401)
}

async function isAvailableCartItem(tx: any, item: CartInput): Promise<boolean> {
  if (item.itemType === 'SERVICE') {
    return Boolean(await tx.service.findFirst({
      where: { id: item.serviceId, isActive: true, isDeleted: false },
      select: { id: true },
    }))
  }
  if (item.itemType === 'PROJECT') {
    return Boolean(await tx.project.findFirst({
      where: { id: item.projectId, isSellable: true, isDeleted: false, price: { not: null } },
      select: { id: true },
    }))
  }
  if (item.itemType === 'PROJECT_KIT') {
    return Boolean(await tx.projectKit.findFirst({
      where: { id: item.projectKitId, isActive: true, isDeleted: false },
      select: { id: true },
    }))
  }

  const product = await tx.product.findFirst({
    where: { id: item.productId, isActive: true, isDeleted: false },
    select: { id: true },
  })
  if (!product) return false
  if (!item.variantId) return true
  return Boolean(await tx.productVariant.findFirst({
    where: { id: item.variantId, productId: item.productId, isActive: true },
    select: { id: true },
  }))
}

function toCartItemData(userId: string, item: CartInput) {
  return {
    userId,
    itemType: item.itemType,
    quantity: item.quantity,
    productId: item.itemType === 'PRODUCT' ? item.productId : null,
    variantId: item.itemType === 'PRODUCT' ? (item.variantId ?? null) : null,
    serviceId: item.itemType === 'SERVICE' ? item.serviceId : null,
    projectId: item.itemType === 'PROJECT' ? item.projectId : null,
    projectKitId: item.itemType === 'PROJECT_KIT' ? item.projectKitId : null,
  }
}

async function readCart(client: any, userId: string): Promise<PersistedCartItem[]> {
  const items = await client.cartItem.findMany({
    where: { userId },
    include: cartItemInclude,
    orderBy: { createdAt: 'asc' },
  })
  return items.map(formatCartItem).filter((item: PersistedCartItem | null): item is PersistedCartItem => item !== null)
}

// GET /api/cart — returns catalog-enriched, currently purchasable cart lines.
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    res.json({ success: true, data: { items: await readCart(db, user.id) } })
  })
)

// PUT /api/cart — atomically replaces the authenticated user's persisted cart.
router.put(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthUser(req)
    const { items } = validateBody(req, replaceCartSchema)

    const persistedItems = await (db as any).$transaction(async (tx: any) => {
      await lockUserCart(tx, user.id)
      const availableItems: CartInput[] = []
      for (const item of deduplicateCart(items)) {
        if (await isAvailableCartItem(tx, item)) availableItems.push(item)
      }

      await tx.cartItem.deleteMany({ where: { userId: user.id } })
      if (availableItems.length > 0) {
        await tx.cartItem.createMany({
          data: availableItems.map((item) => toCartItemData(user.id, item)),
        })
      }
      return readCart(tx, user.id)
    })

    res.json({ success: true, data: { items: persistedItems } })
  })
)

export default router
