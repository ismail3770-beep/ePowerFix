import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://epowerfix.com'
  
  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
    { url: `${baseUrl}/shop`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/deals`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/tools`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${baseUrl}/projects`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
  ]
  
  // Dynamic product pages
  const products = await db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } })
  const productPages = products.map(p => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))
  
  // Dynamic blog pages
  const blogs = await db.blogPost.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } })
  const blogPages = blogs.map(b => ({
    url: `${baseUrl}/blog/${b.slug}`,
    lastModified: b.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))
  
  return [...staticPages, ...productPages, ...blogPages]
}