import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

// Force dynamic rendering — sitemap depends on database which may not
// be available during the static-analysis / build phase on Vercel.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://epowerfix.com'

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
  ]

  // Dynamic product pages (skip if DB unavailable)
  let productPages: MetadataRoute.Sitemap = []
  try {
    const products = await db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } })
    productPages = products.map(p => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch {
    // DB not available (build time), skip dynamic products
  }

  // Dynamic blog pages (skip if DB unavailable)
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const blogs = await db.blogPost.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } })
    blogPages = blogs.map(b => ({
      url: `${baseUrl}/blog/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))
  } catch {
    // DB not available (build time), skip dynamic blogs
  }

  return [...staticPages, ...productPages, ...blogPages]
}