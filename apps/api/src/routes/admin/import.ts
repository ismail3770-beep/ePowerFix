// Admin product import routes: bulk-import products from an uploaded CSV file.
// Backs the admin "Import" page (apps/web/src/app/admin/import).
//
// CSV headers (must match the frontend template):
//   name,slug,description,shortDesc,price,salePrice,stock,sku,category,brand,images,isFeatured,isBestDeal
//
// Behaviour:
//   - Rows are validated individually; bad rows are skipped and reported in
//     `errors` instead of failing the whole import.
//   - Duplicate slugs/SKUs are skipped (counted in `skipped`).
//   - Category/brand names are resolved case-insensitively and auto-created
//     when missing so imports never fail on unknown taxonomy names.
//
// Mounted at /api/admin/import

import { Router } from 'express'

import { db } from '../../lib/db.js'
import { asyncHandler, ApiError } from '../../lib/api-handler.js'
import { parseMultipartFile } from './upload.js'

const router = Router()

const REQUIRED_HEADERS = ['name', 'price']

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Parses a single CSV line, honouring double-quoted fields with "" escapes. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields.map((f) => f.trim())
}

function toBool(value: string): boolean {
  return value.toLowerCase() === 'true' || value === '1'
}

/** Splits an images cell into a JSON-stringified URL array. */
function toImagesJson(cell: string): string {
  if (!cell) return '[]'
  const urls = cell.split(/[|;]/).map((u) => u.trim()).filter(Boolean)
  return JSON.stringify(urls)
}

// ─── POST /api/admin/import/products ────────────────────────────────────────

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const { buffer, filename } = await parseMultipartFile(req)

    if (!filename.toLowerCase().endsWith('.csv')) {
      throw new ApiError('Only CSV files are supported', 400)
    }

    // Strip UTF-8 BOM if present, then split into non-empty lines.
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '')
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)

    if (lines.length < 2) {
      throw new ApiError('CSV file is empty or contains no data rows', 400)
    }

    const headers = parseCsvLine(lines[0])
    for (const required of REQUIRED_HEADERS) {
      if (!headers.includes(required)) {
        throw new ApiError(`Missing required CSV column: "${required}"`, 400)
      }
    }

    const col = (row: string[], name: string): string => {
      const idx = headers.indexOf(name)
      return idx === -1 ? '' : (row[idx] ?? '')
    }

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    // Resolve each taxonomy name only once per import run.
    const categoryCache = new Map<string, string>()
    const brandCache = new Map<string, string>()

    async function resolveCategoryId(name: string): Promise<string> {
      const key = name.toLowerCase()
      const cached = categoryCache.get(key)
      if (cached) return cached
      const existing = await db.productCategory.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, isDeleted: false },
        select: { id: true },
      })
      if (existing) {
        categoryCache.set(key, existing.id)
        return existing.id
      }
      const created = await db.productCategory.create({
        data: {
          name,
          nameBn: name,
          slug: slugify(name) || `category-${Date.now().toString(36)}`,
        },
        select: { id: true },
      })
      categoryCache.set(key, created.id)
      return created.id
    }

    async function resolveBrandId(name: string): Promise<string> {
      const key = name.toLowerCase()
      const cached = brandCache.get(key)
      if (cached) return cached
      const existing = await db.brand.findFirst({
        where: { name: { equals: name, mode: 'insensitive' }, isDeleted: false },
        select: { id: true },
      })
      if (existing) {
        brandCache.set(key, existing.id)
        return existing.id
      }
      const created = await db.brand.create({
        data: { name, slug: slugify(name) || `brand-${Date.now().toString(36)}` },
        select: { id: true },
      })
      brandCache.set(key, created.id)
      return created.id
    }

    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1
      const row = parseCsvLine(lines[i])
      const name = col(row, 'name')
      const priceRaw = col(row, 'price')

      if (!name) {
        errors.push(`Row ${rowNumber}: missing "name"`)
        skipped++
        continue
      }

      const price = Number(priceRaw)
      if (!priceRaw || Number.isNaN(price) || price < 0) {
        errors.push(`Row ${rowNumber} (${name}): invalid price "${priceRaw}"`)
        skipped++
        continue
      }

      const slug = slugify(col(row, 'slug') || name)
      const sku = col(row, 'sku') || null

      // Skip duplicates instead of failing the whole import.
      const duplicate = await db.product.findFirst({
        where: {
          OR: [
            { slug },
            ...(sku ? [{ sku }] : []),
          ],
        },
        select: { id: true },
      })
      if (duplicate) {
        errors.push(`Row ${rowNumber} (${name}): duplicate slug/SKU, skipped`)
        skipped++
        continue
      }

      try {
        const [categoryId, brandId] = await Promise.all([
          resolveCategoryId(col(row, 'category') || 'Uncategorized'),
          resolveBrandId(col(row, 'brand') || 'Generic'),
        ])

        const salePriceRaw = col(row, 'salePrice')
        const stockRaw = col(row, 'stock')

        await db.product.create({
          data: {
            name,
            slug,
            description: col(row, 'description') || name,
            shortDesc: col(row, 'shortDesc') || null,
            sku,
            price,
            salePrice: salePriceRaw ? Number(salePriceRaw) : null,
            stock: stockRaw ? Number(stockRaw) || 0 : 0,
            images: toImagesJson(col(row, 'images')),
            isFeatured: toBool(col(row, 'isFeatured')),
            isBestDeal: toBool(col(row, 'isBestDeal')),
            categoryId,
            brandId,
          },
        })
        imported++
      } catch (err: any) {
        errors.push(`Row ${rowNumber} (${name}): ${err?.message ?? 'import failed'}`)
        skipped++
      }
    }

    res.json({ data: { imported, skipped, errors } })
  })
)

export default router

