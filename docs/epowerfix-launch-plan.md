# ePowerFix Launch Completion Plan

## Top-Level Overview

**Goal:** Complete all remaining gaps in the ePowerFix project to make it launch-ready across Web (Next.js), API (Express), and Mobile (Expo React Native).

**Scope:** Based on deep code investigation, the real remaining gaps are:
1. **Home page** — empty `<main>` tag, existing section components need to be composed in
2. **API TypeScript errors** — 157+ type errors across 38+ route files, primarily `req.params` typing and Prisma casting
3. **Admin dashboard charts** — sales trend and order status charts use hardcoded sample data
4. **Mobile CartSyncProvider** — unclear if cart sync wrapper is applied in app layout
5. **Demo seed data** — no products, services, or blog posts for a fresh deploy
6. **Image upload (BLOCKER)** — admin upload route returns HTTP 501, multer not installed, Cloudinary not wired
7. **Order confirmation email** — no email service integrated; users get no receipt after payment
8. **Footer `/deals` page** — Footer links to `/deals` which does not exist (404)

**What is already done (do NOT re-implement):**
- Mobile auth token persistence (SecureStore fully working)
- Mobile cart screen (Zustand connected)
- Mobile checkout & payment flow (fully wired)
- Blog listing and detail pages (fully functional)
- Admin dashboard stats (fetched from real API)
- Payment callbacks (bKash, Nagad, SSLCommerz — fully validated and secure)
- All navigation routes exist (except `/deals`)

**Approach:** One sub-task per gap, ordered by impact. Each sub-task is independent and reviewable.

---

## Sub-Task 1 — Wire the Home Page

**Status:** `[ ] pending`

**Intent:**
The home page (`apps/web/src/app/page.tsx`) renders an empty `<main>` tag. All 9 section components exist and are self-contained (no props needed, they fetch their own data). This task composes them into the home page layout.

**Expected Outcomes:**
- Home page renders: HeroBanner → TrustBar → CategoryGrid → ShopSection → BestDeals → ServicesSection → BrandStrip → ProjectsSection → NewsletterBanner
- `<main>` tag contains all sections
- `HomeClient` remains for modals/dialogs (unchanged)
- No new components are created

**Todo List:**
1. Read `apps/web/src/app/page.tsx` to confirm current state
2. Add imports for all available section components
3. Replace the empty `<main aria-label="Homepage" />` with a `<main>` containing all section components in logical order
4. Verify `HomeClient` is kept (it handles modals, cart drawer, chat widget, etc.)

**Relevant Context:**
- File to edit: `apps/web/src/app/page.tsx`
- All section components are in `apps/web/src/components/epf/`
- Available components (all zero-prop, self-contained):
  - `HeroBanner` — fetches `/api/banners?type=hero`
  - `TrustBar` — static trust indicators
  - `CategoryGrid` — hardcoded categories with icons
  - `ShopSection` — fetches `/api/products?limit=6`
  - `BestDeals` — fetches `/api/products?limit=10&bestDeals=true`
  - `FlashDeals` — fetches products with flash deal filters
  - `ServicesSection` — fetches `/api/services`
  - `BrandStrip` — static scrolling brand strip
  - `ProjectsSection` — fetches `/api/projects`
  - `NewsletterBanner` — posts to `/api/newsletter`
  - `ServicesBanner` — static services CTA banner
  - `RecentlyViewed` — uses localStorage

---

## Sub-Task 2 — Fix API TypeScript Errors

**Status:** `[ ] pending`

**Intent:**
The API has 157+ TypeScript errors, primarily caused by Express route params being typed as `string | string[]` which conflicts with Prisma expecting `string`. There are also `any` casts and missing type guards. Fixing these makes the codebase type-safe and removes build warnings.

**Expected Outcomes:**
- `bun run typecheck` (or `tsc --noEmit`) passes with 0 errors in `apps/api/`
- No new `as any` casts introduced unless strictly necessary
- Route handler param access uses a consistent, type-safe pattern

**Todo List:**
1. Run `tsc --noEmit` in `apps/api/` to get the exact list of all errors grouped by file
2. Identify the repeating patterns (likely `req.params.id` typed as `string | string[]`)
3. Check if a `requestParam()` utility already exists in the API — if yes, ensure it returns `string` (not `string | string[]`)
4. If the helper doesn't exist or returns wrong type, fix or create a minimal `requestParam(v: string | string[]): string` utility
5. Go file-by-file through the error list and apply the fix pattern
6. Fix any remaining `(db as any)` casts by using correct Prisma model access
7. Re-run typecheck to confirm 0 errors

**Relevant Context:**
- All route files: `apps/api/src/routes/*.ts` and `apps/api/src/routes/admin/*.ts`
- Pattern appears 226+ times: `requestParam(req.params.id)`
- `(db as any).order.findUnique` cast seen in `apps/api/src/routes/orders.ts` line 308
- `getClientIp(req: any)` in `apps/api/src/routes/payments.ts` line 40

---

## Sub-Task 3 — Fix Admin Dashboard Charts

**Status:** `[ ] pending`

**Intent:**
The admin dashboard fetches real stats from `/api/admin/stats` but the sales trend chart and order status donut chart use hardcoded sample data. This sub-task connects those two charts to real API data.

**Expected Outcomes:**
- Sales trend area chart shows real `revenueByMonth` data from the stats API
- Order status donut chart shows real order status breakdown (not hardcoded percentages)
- The stats API already returns `revenueByMonth` (6 months historical) — just needs to be wired to the chart

**Todo List:**
1. Read `apps/web/src/app/admin/page.tsx` lines 100–160 to see current `salesData` and `orderStatusData` construction
2. Read `apps/api/src/routes/admin/stats.ts` lines 1–119 to confirm shape of `revenueByMonth` and order status data returned
3. Update `AdminStats` type (if needed) to include `revenueByMonth` field
4. Replace hardcoded `salesData` array with data mapped from `statsRes.data.revenueByMonth`
5. Replace hardcoded `orderStatusData` percentages with real counts from the stats API response
6. Verify chart still renders correctly with the new data shape

**Relevant Context:**
- Dashboard page: `apps/web/src/app/admin/page.tsx`
- Stats API: `apps/api/src/routes/admin/stats.ts`
- Current hard-coded sales data: `apps/web/src/app/admin/page.tsx` lines 111–119
- Current hard-coded order status: `apps/web/src/app/admin/page.tsx` lines 122–128
- Stats API already returns `revenueByMonth` from lines 65–91 of `stats.ts`

---

## Sub-Task 4 — Verify and Fix Mobile Cart Sync

**Status:** `[ ] pending`

**Intent:**
The mobile cart screen is connected to Zustand but it's unclear if `CartSyncProvider` is applied in the app layout. If it's missing from the root layout, cart items won't sync between sessions or with the server. This sub-task confirms and fixes the provider wrapping.

**Expected Outcomes:**
- `CartSyncProvider` is confirmed present in the app root layout
- Cart state persists across app restarts via AsyncStorage
- Cart merges correctly when user logs in

**Todo List:**
1. Read `apps/mobile/app/_layout.tsx` (or root layout file) to check if `CartSyncProvider` wraps the app
2. Read `apps/mobile/src/components/CartSyncProvider.tsx` to understand what it does
3. Check `@epowerfix/store`'s `cart.ts` to see if AsyncStorage persistence middleware is configured
4. If `CartSyncProvider` is missing from root layout, add it
5. If AsyncStorage persistence is not configured in the Zustand store, add it using `zustand/middleware` `persist` with the AsyncStorage adapter already in the package

**Relevant Context:**
- Root layout: `apps/mobile/app/_layout.tsx`
- Cart sync provider: `apps/mobile/src/components/CartSyncProvider.tsx`
- Cart store: `packages/store/src/cart.ts`

---

## Sub-Task 5 — Add Demo Seed Data

**Status:** `[ ] pending`

**Intent:**
A fresh deployment shows a completely blank storefront because no products, services, or blog posts are seeded. This sub-task adds realistic demo data to `prisma/seed.ts` so the storefront is usable immediately after setup.

**Expected Outcomes:**
- Running `bun run db:seed` seeds at minimum:
  - 10 demo products (with categories, brands, prices, images using placeholder URLs)
  - 5 demo services (electrician services with pricing)
  - 3 demo blog posts (with content and published status)
  - 2–3 product categories (Electrical, Lighting, Tools)
  - 2 brands (generic demo brands)
- All seed data is idempotent (safe to run multiple times — uses `upsert`)
- Admin user, tax, site settings, and marketplace catalog seeds remain unchanged

**Todo List:**
1. Read `prisma/seed.ts` fully to understand current structure and patterns
2. Read `prisma/schema.prisma` for the Product, Service, BlogPost, Category, and Brand model shapes (required fields)
3. Add `seedDemoProducts()` function that upserts 10 products with categories and brands
4. Add `seedDemoServices()` function that upserts 5 services
5. Add `seedDemoBlogPosts()` function that upserts 3 blog posts
6. Call all three functions from the main `seed()` function
7. Update the seed output counts to include the new entities

**Relevant Context:**
- Seed file: `prisma/seed.ts`
- Schema: `prisma/schema.prisma` (Product, Service, BlogPost, Category, Brand models)
- Pattern to follow: existing `upsert` pattern used for admin user and tax (use `where: { slug }` or `where: { id }`)
- Use placeholder image URLs (e.g. `https://placehold.co/400x400`) for product images

---

---

## Sub-Task 6 — Implement Admin Image Upload

**Status:** `[ ] pending`

**Intent:**
The admin upload route at `POST /api/admin/upload` explicitly returns HTTP 501 (Not Implemented). Without this, admins cannot add images to products, blog posts, or banners. This is a hard launch blocker for content management.

**Expected Outcomes:**
- `POST /api/admin/upload` accepts a multipart file and returns a public URL
- Images are stored using Cloudinary (env vars already documented)
- `DELETE /api/admin/upload` continues to work for deletion
- If Cloudinary env vars are not set, falls back to local disk (for dev)

**Todo List:**
1. Read `apps/api/src/routes/admin/upload.ts` fully to understand current stub and the local disk path already configured
2. Check `apps/api/package.json` to confirm `multer` and `cloudinary` are not yet installed
3. Add `multer` and `cloudinary` as dependencies in `apps/api/`
4. Implement the POST handler: use multer to parse the multipart file into memory (buffer), then upload to Cloudinary using the `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` env vars
5. Return the Cloudinary secure URL in the response as `{ url: "https://..." }`
6. If Cloudinary env vars are absent (dev mode), fall back to saving to `UPLOAD_DIR` on disk and returning the local `/uploads/<filename>` path
7. Keep the existing DELETE handler unchanged

**Relevant Context:**
- File to edit: `apps/api/src/routes/admin/upload.ts`
- Cloudinary env vars already documented in `apps/api/.env.example`
- `UPLOAD_DIR` local fallback already defined in upload.ts lines 26–28
- Env config: `apps/api/src/config/env.ts`

---

## Sub-Task 7 — Implement Order Confirmation Email

**Intent:**
No email service is integrated. After a successful order or payment, customers receive no receipt. This is needed for trust and transparency, especially for online payment users.

**Status:** `[ ] pending`

**Expected Outcomes:**
- After an order is created (COD) or a payment is confirmed (bKash/Nagad/SSLCommerz), a confirmation email is sent to `customerEmail` if provided
- Email contains: order number, items summary, total, payment method, delivery address
- Uses Resend (simple REST-based email service, no SMTP needed)
- If `RESEND_API_KEY` is not set, email is skipped silently (dev-safe)

**Todo List:**
1. Add `resend` as a dependency in `apps/api/`
2. Create a minimal email utility at `apps/api/src/lib/email.ts` that exports a `sendOrderConfirmation(order)` function
3. The function should: check if `RESEND_API_KEY` is set, build a simple HTML email with order details, send via Resend API
4. Call `sendOrderConfirmation()` in `apps/api/src/routes/orders.ts` after a COD order is successfully created
5. Call `sendOrderConfirmation()` in `apps/api/src/routes/payments.ts` inside `markPaymentPaid()` after order status is set to CONFIRMED
6. Add `RESEND_API_KEY` and `EMAIL_FROM` to `apps/api/.env.example`

**Relevant Context:**
- Orders route: `apps/api/src/routes/orders.ts` (POST handler for order creation)
- Payment confirmation: `apps/api/src/routes/payments.ts` — `markPaymentPaid()` function
- No email utility exists yet — create from scratch at `apps/api/src/lib/email.ts`

---

## Sub-Task 8 — Fix Footer `/deals` Dead Link

**Status:** `[ ] pending`

**Intent:**
The Footer links to `/deals` which has no page, causing a 404 for users. The simplest fix is to either remove the link or create a minimal redirect page pointing to `/shop`.

**Expected Outcomes:**
- Clicking "Deals" in the Footer no longer produces a 404
- Minimal change — either link removed or a redirect page created

**Todo List:**
1. Read `apps/web/src/components/epf/Footer.tsx` to find the `/deals` link (around line 31)
2. Remove the "Deals" link from the footer links array (simplest fix)
   — OR — create `apps/web/src/app/deals/page.tsx` that redirects to `/shop` using Next.js `redirect()`
3. Verify no other components link to `/deals`

**Relevant Context:**
- Footer file: `apps/web/src/components/epf/Footer.tsx` line ~31
- If creating redirect: use `import { redirect } from 'next/navigation'; export default function DealsPage() { redirect('/shop'); }`

---

## Completion Checklist

- [ ] Sub-Task 1: Home page renders all section components
- [ ] Sub-Task 2: API TypeScript errors = 0
- [ ] Sub-Task 3: Admin dashboard charts show real data
- [ ] Sub-Task 4: Mobile cart sync confirmed working
- [ ] Sub-Task 5: Demo seed data added and idempotent
- [ ] Sub-Task 6: Admin image upload works (Cloudinary or local)
- [ ] Sub-Task 7: Order confirmation email sent via Resend
- [ ] Sub-Task 8: Footer `/deals` dead link fixed
