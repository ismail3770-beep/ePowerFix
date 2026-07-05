/**
 * Server Actions Migration Template
 *
 * This file demonstrates the BEFORE (API Route) vs AFTER (Server Action)
 * pattern for migrating CRUD routes to Next.js Server Actions.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * BEFORE: Traditional API Route (src/app/api/admin/brands/route.ts)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   import { NextRequest } from 'next/server'
 *   import { db } from '@/lib/db'
 *   import { requireAdmin, jsonResponse, errorResponse } from '@/lib/auth'
 *
 *   export async function POST(request: NextRequest) {
 *     const auth = await requireAdmin()
 *     if (!auth.ok) return auth.response!
 *
 *     const body = await request.json()  // ❌ No validation
 *     if (!body.name) return errorResponse('name is required', 400)
 *
 *     const brand = await db.brand.create({
 *       data: { name: body.name, slug: body.slug || slugify(body.name) }
 *     })
 *     return jsonResponse({ data: brand }, 201)
 *   }
 *
 * Problems:
 *   1. No type safety — body is `any`
 *   2. Client must fetch() + serialize JSON
 *   3. No CSRF protection (relies on httpOnly cookie)
 *   4. Error handling is manual
 *   5. Network round-trip overhead
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * AFTER: Server Action (src/app/actions/brands.ts)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   "use server"
 *
 *   import { z } from 'zod'
 *   import { db } from '@/lib/db'
 *   import { revalidatePath } from 'next/cache'
 *   import { requireAdmin } from '@/lib/auth'
 *
 *   const createBrandSchema = z.object({
 *     name: z.string().min(1).max(200),
 *     slug: z.string().optional(),
 *     logo: z.string().optional(),
 *     description: z.string().optional(),
 *   })
 *
 *   export async function createBrand(formData: FormData) {
 *     // 1. Auth check
 *     const auth = await requireAdmin()
 *     if (!auth.ok) return { success: false, error: 'Unauthorized' }
 *
 *     // 2. Parse + validate with Zod
 *     const parsed = createBrandSchema.safeParse({
 *       name: formData.get('name'),
 *       slug: formData.get('slug') || undefined,
 *       logo: formData.get('logo') || undefined,
 *       description: formData.get('description') || undefined,
 *     })
 *     if (!parsed.success) {
 *       return { success: false, errors: parsed.error.issues }
 *     }
 *
 *     // 3. Business logic
 *     const brand = await db.brand.create({
 *       data: {
 *         name: parsed.data.name,
 *         slug: parsed.data.slug || slugify(parsed.data.name),
 *         logo: parsed.data.logo || null,
 *         description: parsed.data.description || null,
 *       }
 *     })
 *
 *     // 4. Cache invalidation
 *     revalidatePath('/admin/brands')
 *     const { cache } = await import('@/lib/cache')
 *     await cache.del('brands:all')
 *
 *     // 5. Return typed result
 *     return { success: true, data: brand }
 *   }
 *
 * Benefits:
 *   1. Full TypeScript type safety (Zod-inferred types)
 *   2. No client-side fetch() needed — form action={createBrand}
 *   3. Automatic CSRF protection (same-origin only)
 *   4. Progressive enhancement (works without JS)
 *   5. Zero network serialization overhead
 *   6. revalidatePath() for instant cache invalidation
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * USAGE IN A COMPONENT:
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   import { createBrand } from '@/app/actions/brands'
 *
 *   function BrandForm() {
 *     return (
 *       <form action={createBrand}>
 *         <input name="name" placeholder="Brand name" required />
 *         <input name="slug" placeholder="Slug (optional)" />
 *         <button type="submit">Create Brand</button>
 *       </form>
 *     )
 *   }
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIGRATION CHECKLIST (for each of the 110 routes):
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   [ ] 1. Create Zod schema for the input fields
 *   [ ] 2. Add "use server" at the top of the file
 *   [ ] 3. Export async function that accepts FormData
 *   [ ] 4. Parse + validate with Zod safeParse
 *   [ ] 5. Add auth check (requireAdmin / requireAuth)
 *   [ ] 6. Execute business logic (db query)
 *   [ ] 7. Add cache invalidation if needed
 *   [ ] 8. Add revalidatePath for affected pages
 *   [ ] 9. Return { success: boolean, data?: T, error?: string }
 *   [ ] 10. Update the frontend form to use action={serverAction}
 *   [ ] 11. Keep the old API route as fallback (delete after migration)
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * ROUTES TO MIGRATE FIRST (highest traffic / most benefit):
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 *   Priority 1 (forms): contact, newsletter, quote-requests, reviews, services/book
 *   Priority 2 (admin CRUD): products, brands, categories, services, blog, banners
 *   Priority 3 (user): orders, wishlist, profile, change-password
 *   Priority 4 (admin management): coupons, flash-sales, taxes, users, shipments
 *   Priority 5 (GET routes): These stay as API routes (Server Actions are for mutations)
 */

// Already migrated Server Actions:
// - submitContact (src/app/actions/index.ts)
// - subscribeNewsletter (src/app/actions/index.ts)
// - submitQuoteRequest (src/app/actions/index.ts)

// To migrate more, copy the pattern above into new files under src/app/actions/
