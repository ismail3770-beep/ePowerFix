// Admin menu routes: list, create, update, delete + nested menu-item CRUD.
// Backs the admin "Menus" page (apps/web/src/app/admin/menus).
//
// Mounted at /api/admin/menus

import { Router } from 'express'
import { z } from 'zod'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError, validateBody } from '../../lib/api-handler.js'

const router = Router()

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const menuSchema = z
  .object({
    name: z.string().min(1),
    slug: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

const menuItemSchema = z
  .object({
    label: z.string().min(1),
    url: z.string().min(1),
    target: z.string().optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .passthrough()

const itemsInclude = {
  items: { orderBy: { order: 'asc' as const } },
}

// ─── GET /api/admin/menus ────────────────────────────────────────────────────

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const menus = await db.menu.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'asc' },
      include: itemsInclude,
    })
    res.json({ data: menus })
  })
)

// ─── POST /api/admin/menus ───────────────────────────────────────────────────

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = validateBody(req, menuSchema)

    const slug = slugify(body.slug || body.name)
    const existing = await db.menu.findUnique({ where: { slug } })
    if (existing && !existing.isDeleted) {
      throw new ApiError('A menu with this slug already exists', 400)
    }

    const menu = await db.menu.create({
      data: {
        name: body.name,
        slug,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
      include: itemsInclude,
    })
    res.status(201).json({ data: menu })
  })
)

// ─── PUT /api/admin/menus/:id ────────────────────────────────────────────────

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, menuSchema.partial())

    const existing = await db.menu.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Menu not found', 404)
    }

    const data: any = {}
    if (body.name !== undefined) data.name = body.name
    if (body.slug !== undefined || body.name !== undefined) {
      const slug = slugify(body.slug || (body.name as string))
      const owner = await db.menu.findUnique({ where: { slug } })
      if (owner && owner.id !== id) {
        throw new ApiError('A menu with this slug already exists', 400)
      }
      data.slug = slug
    }
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    const menu = await db.menu.update({ where: { id }, data, include: itemsInclude })
    res.json({ data: menu })
  })
)

// ─── DELETE /api/admin/menus/:id ─────────────────────────────────────────────

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const existing = await db.menu.findUnique({ where: { id } })
    if (!existing || existing.isDeleted) {
      throw new ApiError('Menu not found', 404)
    }

    await db.menu.update({ where: { id }, data: { isDeleted: true, isActive: false } })
    res.json({ message: 'Menu deleted' })
  })
)

// ─── POST /api/admin/menus/:id/items ─────────────────────────────────────────

router.post(
  '/:id/items',
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const body = validateBody(req, menuItemSchema)

    const menu = await db.menu.findUnique({ where: { id } })
    if (!menu || menu.isDeleted) {
      throw new ApiError('Menu not found', 404)
    }

    // Append to the end when no explicit order is given.
    const maxOrder = await db.menuItem.aggregate({
      where: { menuId: id },
      _max: { order: true },
    })
    const order = body.order !== undefined ? body.order : (maxOrder._max.order ?? -1) + 1

    const item = await db.menuItem.create({
      data: {
        menuId: id,
        label: body.label,
        url: body.url,
        target: body.target || '_self',
        order,
        isActive: body.isActive !== undefined ? !!body.isActive : true,
      },
    })
    res.status(201).json({ data: item })
  })
)

// ─── PUT /api/admin/menus/:id/items/:itemId ──────────────────────────────────

router.put(
  '/:id/items/:itemId',
  asyncHandler(async (req, res) => {
    const { id, itemId } = req.params
    const body = validateBody(req, menuItemSchema.partial())

    const item = await db.menuItem.findFirst({ where: { id: itemId, menuId: id } })
    if (!item) {
      throw new ApiError('Menu item not found', 404)
    }

    const data: any = {}
    if (body.label !== undefined) data.label = body.label
    if (body.url !== undefined) data.url = body.url
    if (body.target !== undefined) data.target = body.target
    if (body.order !== undefined) data.order = body.order
    if (body.isActive !== undefined) data.isActive = !!body.isActive

    const updated = await db.menuItem.update({ where: { id: itemId }, data })
    res.json({ data: updated })
  })
)

// ─── DELETE /api/admin/menus/:id/items/:itemId ───────────────────────────────

router.delete(
  '/:id/items/:itemId',
  asyncHandler(async (req, res) => {
    const { id, itemId } = req.params

    const item = await db.menuItem.findFirst({ where: { id: itemId, menuId: id } })
    if (!item) {
      throw new ApiError('Menu item not found', 404)
    }

    await db.menuItem.delete({ where: { id: itemId } })
    res.json({ message: 'Menu item deleted' })
  })
)

export default router

