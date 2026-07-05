/**
 * Cloud Migration Script — Local → Cloudinary
 *
 * Iterates through public/uploads/, uploads every file to Cloudinary,
 * generates a report, and provides a Prisma snippet to bulk-update
 * database records with new Cloudinary URLs.
 *
 * Usage:
 *   bun run scripts/migrate-to-cloudinary.ts
 *
 * Prerequisites:
 *   1. bun add cloudinary
 *   2. Set in .env:
 *      CLOUDINARY_CLOUD_NAME=your_cloud_name
 *      CLOUDINARY_API_KEY=your_api_key
 *      CLOUDINARY_API_SECRET=your_api_secret
 *      DATABASE_URL=postgresql://...
 *
 * Output:
 *   - Console report with old path → new URL mapping
 *   - JSON report saved to scripts/migration-report.json
 *   - Prisma snippet printed for bulk DB update
 */

import { promises as fs } from 'fs'
import path from 'path'

// ─── Configuration ────────────────────────────────────────────────────────────

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')
const REPORT_FILE = path.join(process.cwd(), 'scripts', 'migration-report.json')

interface MigrationEntry {
  filename: string
  oldPath: string       // /uploads/products/xxx.jpg
  newUrl: string        // https://res.cloudinary.com/...
  publicId: string      // epowerfix/products/xxx
  bytes: number
  status: 'success' | 'failed'
  error?: string
}

// ─── Cloudinary Init ──────────────────────────────────────────────────────────

async function initCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('❌ Cloudinary credentials not found in .env')
    console.error('   Set: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET')
    process.exit(1)
  }

  const cloudinary = (await import('cloudinary')).default
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })

  return cloudinary
}

// ─── Upload Single File ───────────────────────────────────────────────────────

async function uploadFile(
  cloudinary: any,
  filePath: string,
  filename: string,
  subfolder: string,
): Promise<{ url: string; publicId: string; bytes: number }> {
  const publicId = `epowerfix/${subfolder}/${filename.replace(/\.[^.]+$/, '')}`

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePath,
      {
        resource_type: 'auto',
        public_id: publicId,
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
          })
        }
      },
    )
  })
}

// ─── Walk Directory ──────────────────────────────────────────────────────────

async function walkDir(dir: string): Promise<string[]> {
  const files: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const subFiles = await walkDir(fullPath)
      files.push(...subFiles)
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Cloudinary Migration Script')
  console.log('  Source: public/uploads/')
  console.log('  Target: Cloudinary (epowerfix/)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Init Cloudinary
  const cloudinary = await initCloudinary()
  console.log('✅ Cloudinary connected\n')

  // Check if uploads directory exists
  try {
    await fs.access(UPLOADS_DIR)
  } catch {
    console.log('ℹ️  public/uploads/ does not exist — nothing to migrate.')
    process.exit(0)
  }

  // Collect all files
  const allFiles = await walkDir(UPLOADS_DIR)
  console.log(`📁 Found ${allFiles.length} files to migrate\n`)

  if (allFiles.length === 0) {
    console.log('✅ No files to migrate.')
    process.exit(0)
  }

  // Upload each file
  const report: MigrationEntry[] = []
  let success = 0
  let failed = 0

  for (let i = 0; i < allFiles.length; i++) {
    const filePath = allFiles[i]
    const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath)
    const oldPath = `/${relativePath}`
    const filename = path.basename(filePath)
    const subfolder = path.dirname(relativePath).replace(/^uploads\/?/, '') || 'general'

    process.stdout.write(`  [${i + 1}/${allFiles.length}] ${filename}...`)

    try {
      const result = await uploadFile(cloudinary, filePath, filename, subfolder)
      report.push({
        filename,
        oldPath,
        newUrl: result.url,
        publicId: result.publicId,
        bytes: result.bytes,
        status: 'success',
      })
      success++
      console.log(` ✅ ${result.url}`)
    } catch (err: any) {
      report.push({
        filename,
        oldPath,
        newUrl: '',
        publicId: '',
        bytes: 0,
        status: 'failed',
        error: err?.message,
      })
      failed++
      console.log(` ❌ ${err?.message}`)
    }

    // Rate limit: 10 files per second
    if ((i + 1) % 10 === 0) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  // Save report
  await fs.writeFile(REPORT_FILE, JSON.stringify(report, null, 2))
  console.log(`\n📄 Report saved to: ${REPORT_FILE}`)

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  MIGRATION SUMMARY')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log(`  Total files:  ${allFiles.length}`)
  console.log(`  Success:      ${success} ✅`)
  console.log(`  Failed:       ${failed} ❌`)
  console.log(`  Total bytes:  ${(report.reduce((a, r) => a + r.bytes, 0) / 1024 / 1024).toFixed(2)} MB`)

  // Generate Prisma update snippet
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  PRISMA BULK UPDATE SNIPPET')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('  Run this script to update database records:')
  console.log('  (Save as: scripts/update-db-urls.ts)\n')

  const successful = report.filter((r) => r.status === 'success')

  console.log(`  import { db } from '../src/lib/db'
  import { readFileSync } from 'fs'

  async function updateDbUrls() {
    const report: { oldPath: string; newUrl: string }[] = JSON.parse(
      readFileSync('scripts/migration-report.json', 'utf-8')
    ).filter((r: any) => r.status === 'success')

    console.log(\`Updating \${report.length} URLs in database...\`)

    for (const entry of report) {
      // Update Product images (stored as JSON array of URLs)
      const products = await db.product.findMany({
        where: { images: { contains: entry.oldPath } },
      })
      for (const p of products) {
        const updated = p.images.replace(entry.oldPath, entry.newUrl)
        await db.product.update({ where: { id: p.id }, data: { images: updated } })
      }

      // Update Product coverImage
      await db.product.updateMany({
        where: { images: { contains: entry.oldPath } },
        data: {},
      })

      // Update Banner images
      await db.banner.updateMany({
        where: { image: entry.oldPath },
        data: { image: entry.newUrl },
      })

      // Update BlogPost coverImage
      await db.blogPost.updateMany({
        where: { coverImage: entry.oldPath },
        data: { coverImage: entry.newUrl },
      })

      // Update ProjectKit coverImage
      await db.projectKit.updateMany({
        where: { coverImage: entry.oldPath },
        data: { coverImage: entry.newUrl },
      })

      // Update Service images (JSON array)
      const services = await db.service.findMany({
        where: { images: { contains: entry.oldPath } },
      })
      for (const s of services) {
        const updated = s.images.replace(entry.oldPath, entry.newUrl)
        await db.service.update({ where: { id: s.id }, data: { images: updated } })
      }
    }

    console.log('✅ Database URLs updated!')
    await db.$disconnect()
  }

  updateDbUrls().catch(console.error)`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Migration complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
