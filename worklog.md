---
Task ID: AUDIT-1
Agent: Audit Agent
Task: Comprehensive bug + security audit

Work Log:
- Read /home/z/my-project/worklog.md — file did not exist yet (first audit pass).
- Read full prisma/schema.prisma (867 lines) to capture the current shape of every
  model, especially Project vs ProjectKit vs ProjectKitItem, and the
  CartItem/OrderItem `projectId` field (which is @map("kit_id") and references
  ProjectKit.id — the field name is misleading but the relation is correct).
- Ran broad grep across src/ for stale references to `isSellable`, `db.project`,
  `db.projectKit`, `projectId`, `projectKitItem`, and `comparePrice` to map every
  stale call site.
- Read every relevant file in detail:
  • src/app/api/admin/projects/route.ts and [id]/route.ts
  • src/app/api/admin/project-kits/route.ts, [id]/route.ts, [id]/items/route.ts,
    [id]/items/[itemId]/route.ts
  • src/app/api/projects/route.ts and [slug]/route.ts
  • src/app/api/project-kits/route.ts and [slug]/route.ts
  • src/app/api/orders/route.ts (cart→order POST flow)
  • src/app/api/orders/track/route.ts and orders/[id]/return/route.ts
  • src/app/api/payments/initiate/route.ts + sslcommerz/bkash/nagad callbacks
  • src/lib/auth.ts (cookie-session requireAuth), src/lib/auth-utils.ts
    (Bearer-only requireAuth), src/lib/api.ts (apiFetch), src/lib/payments.ts,
    src/lib/admin-api.ts, src/lib/rate-limit.ts
  • src/components/epf/ShopSection.tsx, ProjectDetailDialog.tsx, CartDrawer.tsx,
    CheckoutDialog.tsx, HeroBanner.tsx, Header.tsx, Footer.tsx,
    ProjectsSection.tsx
  • src/app/admin/projects/page.tsx, project-kits/page.tsx, products/page.tsx,
    blog/page.tsx, coupons/page.tsx, banners/page.tsx, login/page.tsx
  • src/app/projects/page.tsx, projects/[slug]/page.tsx, project-kits/page.tsx
  • src/app/checkout/page.tsx, contact/page.tsx, get-quote/page.tsx,
    order-track/page.tsx, login/page.tsx
  • src/store/cart-store.ts
  • src/app/api/settings/route.ts (public), src/app/api/admin/settings/route.ts,
    src/app/api/admin/users/route.ts and [id]/route.ts, src/app/api/admin/orders/*
  • src/app/api/auth/login, register, profile, change-password, me, logout routes
  • src/app/api/contact, quote-requests, returns, reviews, wishlist, newsletter,
    services, services/book, downloads/*
  • src/app/api/ai/agent/route.ts
- Verified every admin API route uses requireAdmin() (grep across
  src/app/api/admin). Confirmed no $queryRaw / $executeRaw usage anywhere — no
  SQL-injection surface.
- Cross-checked the Prisma schema: confirmed Project model has NO `category`,
  `isSellable`, `price`, `salePrice`, `isFeatured`, `githubUrl`, `liveUrl`,
  `features`, or `rating` fields. Confirmed Service model has NO `salePrice`
  field. Confirmed ProjectKit has NO `rating` field.

Stage Summary:

== 1. STALE SCHEMA REFERENCES (Project.isSellable / price / salePrice) ==

1.1  src/app/admin/projects/page.tsx
   - L37-39: Project interface declares `isSellable?`, `price?`, `salePrice?`.
   - L43-47: defaultForm ships `isSellable:false, price:"", salePrice:""`.
   - L97-100: openEdit() copies `p.isSellable`, `p.price`, `p.salePrice` into the
     form (always undefined now).
   - L118-120: save() POSTs `isSellable`, `price`, `salePrice` to
     /api/admin/projects. The API silently ignores them (see 1.4) so the admin
     form appears to save but nothing persists.
   - L190: Table "Sellable" column renders `p.isSellable ? Yes : "—"` — always
     shows "—" because the field is always undefined.
   - L251: Checkbox bound to `form.isSellable`.
   - L256-266: Conditional price/salePrice inputs shown only when isSellable is
     true — never useful since the value can never be persisted.

1.2  src/app/projects/page.tsx (public Projects listing)
   - L20-34: ProjectItem interface declares `category`, `price?`, `salePrice?`,
     `isSellable?`, `isFeatured?`, `isActive?` — NONE of these exist on the
     Project model (Project only has title/titleBn/slug/description/coverImage/
     images/client/location/status/isDeleted/startDate/endDate/createdAt/updatedAt).
   - L98-99: `{project.isSellable && project.price != null && (...)}` always
     evaluates to false — the price badge never renders.
   - L166: Filter `p.category?.toLowerCase() === activeCategory.toLowerCase()`
     — `p.category` is always undefined, so selecting any category other than
     "all" yields an empty list. The category sidebar is effectively broken.
   - L90, L96: also reference `project.category` for labels/icons — always
     falls back to "FolderOpen" / shows "undefined".

1.3  src/app/projects/[slug]/page.tsx (public Project detail)
   - L18-33: ProjectDetail interface declares `category`, `price?`, `salePrice?`,
     `githubUrl?`, `liveUrl?`, `features?`, `isSellable?` — none exist on Project.
   - L70: `CATEGORIES[p.category?.toLowerCase()]` always returns undefined →
     falls back to "General".
   - L85: breadcrumb link `href={`/projects?category=${p.category}`}` always
     emits `?category=undefined`.
   - L116: `{p.liveUrl && <a href={p.liveUrl}>Live Demo</a>}` — never renders.
   - L117-118: `{p.githubUrl && ...View Source...}` — never renders.
   - L119-124: `{p.isSellable && p.price != null && (...)}` — never renders the
     price block.
   - L137: same isSellable/price check inside the Project Info sidebar — never
     renders the Price row.

1.4  src/app/api/admin/projects/route.ts
   - L73: doc-comment still lists `isSellable?, price?, salePrice?` as accepted
     body fields (cosmetic only — the POST handler at L93-107 does NOT write
     them, so they are silently dropped).

1.5  src/app/api/admin/projects/[id]/route.ts
   - L75-88: PUT handler updates only the canonical Project fields. Any
     `isSellable`/`price`/`salePrice` sent by the admin form (see 1.1) is
     silently ignored.

== 2. PROJECTKIT vs PROJECT CONFUSION ==

2.1  src/components/epf/ShopSection.tsx — OK
   - L21-34: declares a ProjectKit interface (title, slug, price, salePrice,
     coverImage, images, category, difficulty, stock, itemCount).
   - L98-101: fetches /api/project-kits.
   - L118-130: addKit() uses `itemType: "PROJECT"` with `productId: k.id`. ✓
   - No confusion. This component was correctly migrated.

2.2  src/components/epf/ProjectDetailDialog.tsx — OK
   - L14-33: ProjectKit interface with items[] array.
   - L68: fetches /api/project-kits, then filters client-side by selectedProjectId.
   - L87-99: handleBuy() correctly uses itemType "PROJECT". ✓
   - Minor inefficiency: fetches ALL kits then filters client-side instead of
     calling /api/project-kits/[slug] — but not a bug.

2.3  src/app/api/projects/route.ts — OK (uses db.project, intended for portfolio).
2.4  src/app/api/projects/[slug]/route.ts — OK (db.project.findFirst).
2.5  src/app/api/project-kits/route.ts — OK (db.projectKit).
2.6  src/app/api/project-kits/[slug]/route.ts — OK (db.projectKit.findFirst with
     items.product include).
2.7  src/app/projects/page.tsx — MIXED BUG: correctly hits /api/projects, but
     the page treats portfolio Projects as if they were sellable kits (see 1.2).
     The page won't crash but is functionally broken (no category filter, no
     price display).
2.8  src/app/projects/[slug]/page.tsx — MIXED BUG: correctly hits
     /api/projects/[slug], but renders non-existent fields (see 1.3).
2.9  src/app/project-kits/page.tsx — Mostly OK. L614 filters kits by
     `Math.round(k.rating || 0) >= selectedRating` but ProjectKit has NO
     `rating` field. → `k.rating` is always undefined → `0 >= selectedRating`.
     Selecting 4★/3★/2★/1★ filter hides ALL kits (since 0 >= 1 is false).
     UX bug — the rating filter is non-functional.

== 3. API ROUTE CRASHES / FIELD-DOES-NOT-EXIST ==

3.1  src/app/api/orders/route.ts L103 — **TypeScript build-breaking**:
       unitPrice = service.salePrice ?? service.basePrice
     The Service model (schema.prisma L475-503) has NO `salePrice` field —
     only `basePrice`. With `strict: true` in tsconfig.json, this is a
     compile-time error and will fail `next build`. At runtime, if TS strict
     were bypassed, `service.salePrice` would be `undefined` and the `??`
     falls back to `basePrice` — but the build would fail first.
     FIX: `unitPrice = service.basePrice`.

3.2  src/app/api/admin/project-kits/[id]/items/[itemId]/route.ts L16, L53 —
     destructures `{ kitId, itemId }` from `params`, but the params type
     (L10, L47) is `{ id: string; itemId: string }` (Next.js dynamic segment
     is `[id]`, not `[kitId]`). `kitId` is therefore always `undefined`.
     `db.projectKitItem.findFirst({ where: { id: itemId, kitId: undefined } })`
     silently ignores the `kitId` filter (Prisma treats undefined as "no
     filter"). Impact: any admin can update or delete ANY kit item by knowing
     just its itemId — the kitId in the URL is never actually verified.
     Cross-kit item modification / deletion is possible.

3.3  src/app/api/orders/route.ts L161-162 — logic bug:
       const fullAddress = `${address}, ${area || ''}`.toLowerCase()  // never used
       const isInsideDhaka = area && /dhaka|ঢাকা/i.test(area)
     `fullAddress` is computed but never read. `isInsideDhaka` only checks the
     `area` string (which is fine), but the dead `fullAddress` variable
     suggests intended logic was lost. Not a crash.

== 4. ADMIN PAGES WITH BROKEN FORMS ==

4.1  src/app/admin/projects/page.tsx — broken form. The form sends
     `isSellable`, `price`, `salePrice` to /api/admin/projects POST and PUT,
     but neither route persists them (the Project model has no such fields).
     The admin can fill the "Sellable as Kit" checkbox + price/salePrice
     inputs, click Save, get a success toast — but the values are silently
     dropped. On the next refresh, the table's "Sellable" column shows "—"
     for every row, and editing any project reopens the form with isSellable
     = false (data-loss UX). See §1.1.

4.2  src/app/admin/products/page.tsx — partially-broken form (comparePrice
     round-trip data loss). The form sends `comparePrice` (line 360-361
     input). The API at /api/admin/products/route.ts L150-156 stores
     `comparePrice` AS `salePrice` (no separate comparePrice column).
     When the admin re-opens the edit dialog (openEdit at L135-151), it
     reads `comparePrice: product.comparePrice ?? 0` — but the API returns
     `salePrice`, not `comparePrice`, so `product.comparePrice` is undefined
     and the form field always shows 0. The previously-saved compare-at
     price is invisible on edit (silent round-trip data loss).
     isBestDeal: form.isBestDeal is correctly sent and persisted (✓ via
     spread at L156-157).

4.3  Storefront `comparePrice` consumption is broken project-wide:
     - src/components/epf/ShopSection.tsx L13, L146-148, L194
     - src/components/epf/BestDeals.tsx L12, L24-25, L105-107
     - src/components/epf/ProductDetailDialog.tsx L18, L85, L185-187
     - src/components/epf/FlashDeals.tsx L16, L108-110
     - src/app/shop/page.tsx L59, L212-213, L316-318, L339-340, L406-408
     - src/app/product/[id]/page.tsx L39, L159, L351-353
     - src/app/deals/page.tsx L42, L162-167, L264-266, L366-371
     None of these read `comparePrice` from the API correctly — the public
     /api/products route returns `price` and `salePrice` (no `comparePrice`),
     so `product.comparePrice` is always undefined. Net effect:
       • Discount badges never render.
       • Strikethrough original-price never renders.
       • /deals page filter `p.comparePrice && p.comparePrice > p.price`
         (L366) filters OUT every product — the /deals page is always empty
         even when products have a real salePrice.
     FIX: use `product.price` as the list price and `product.salePrice` as
     the discounted price across the storefront.

4.4  src/app/admin/project-kits/page.tsx — OK. Sends correct fields
     (title, description, coverImage, category, difficulty, price, salePrice,
     stock, isActive) that the /api/admin/project-kits POST/PUT routes
     accept. Items-management dialog also sends the right payload.

== 5. SECURITY ==

5.1  **CRITICAL** — src/app/api/settings/route.ts L10-21 leaks payment-gateway
     secrets to anonymous callers. The public GET returns the entire
     SiteSettings row, which includes:
       bkashApiKey, bkashSecretKey, bkashPhoneNumber, bkashSandbox,
       nagadApiKey, nagadSecretKey, nagadPhoneNumber, nagadSandbox,
       sslcommerzStoreId, sslcommerzStorePassword, sslcommerzSandbox,
       bankTransferInstructions, codFee, shippingInsideDhaka, etc.
     Any visitor can `curl /api/settings` and steal every gateway credential.
     FIX: whitelist the public fields (siteName, logoUrl, social links,
     shipping rates, codFee, codEnabled, gateway ENABLED flags only — never
     the API keys/secrets/store passwords).

5.2  **CRITICAL** — src/app/api/payments/initiate/route.ts L5 + L26 uses
     `requireAuth` from `@/lib/auth-utils`, which only reads the
     `Authorization: Bearer` header. It does NOT read the httpOnly `token`
     cookie (the comment in auth-utils.ts L40-42 admits this). But the
     storefront `apiFetch` (src/lib/api.ts L7-11) only sends cookies
     (`credentials: 'include'`), never a Bearer header. Result: every call
     to /api/payments/initiate from src/app/checkout/page.tsx (L153) and
     src/components/epf/CheckoutDialog.tsx (L96) returns 401
     "Authentication required". **All non-COD online payment flows
     (bKash / Nagad / SSLCommerz) are completely broken for cookie-session
     users.** FIX: use `requireAuth` from `@/lib/auth` (cookie-aware) or
     forward the cookie as a Bearer header in apiFetch.

5.3  src/app/api/payments/initiate/route.ts L27 — `return auth.response`
     (no non-null assertion). `AuthResult.response` is `Response | undefined`.
     Under `strict: true` TypeScript will flag this as "Object is possibly
     'undefined'" — potential build error. Functionally safe because the
     preceding `if (!auth.ok)` guarantees `response` is set, but TypeScript
     doesn't know that.

5.4  No rate limiting on auth routes — src/app/api/auth/login/route.ts,
     src/app/api/auth/register/route.ts, src/app/api/auth/change-password/route.ts
     have NO `checkRateLimit` call. Only /api/payments/initiate uses it. This
     allows unlimited login attempts (brute-force / credential stuffing),
     unlimited registration attempts, and unlimited password-change attempts.

5.5  No rate limiting on public AI endpoint — src/app/api/ai/agent/route.ts
     accepts any `body.message` (no length cap) and proxies to the ZAI LLM
     SDK. No auth, no rate limit. Anyone can drain the AI provider's quota.

5.6  Public POST routes that create rows without auth or rate limiting:
     - /api/contact      (creates Contact rows)
     - /api/quote-requests (creates QuoteRequest rows)
     - /api/newsletter   (creates Newsletter rows — at least email-validated)
     - /api/orders       (creates Order + OrderItem + OrderHistory rows)
     - /api/services/book (creates ServiceBooking rows)
     - /api/reviews      (requires auth, no rate limit)
     Spam-abuse vector: an attacker can flood the admin panels with
     thousands of fake contact messages, quote requests, orders, or
     bookings. /api/orders is particularly concerning because it also
     increments coupon usage counts (L235-239) and creates real order
     numbers — a malicious caller could exhaust coupon usage limits.

5.7  Input-validation gaps on public routes:
     - /api/contact L15-19: email format NOT validated (only required check).
     - /api/quote-requests L15-19: phone/email format NOT validated.
     - /api/orders L81-86: `customerPhone` not validated (no BD phone regex),
       `customerEmail` not format-validated, `items: any[]` not shape-validated
       (only that it's a non-empty array). `item.quantity` is `Number(...)||1`
       but no upper bound — could be 999999. `paymentMethod` not validated
       against an enum (accepts any string).
     - /api/services/book L14-19: `phone` not validated, `bookingDate`
       parsed with `new Date(bookingDate)` — invalid date strings produce
       `Invalid Date` which Prisma may reject at insert time but with a
       raw error message.
     - /api/reviews L52-56: `rating` not validated as integer (accepts 4.5),
       `productId`/`serviceId` not validated to exist before insert (FK
       will throw, but error message is raw).
     - /api/wishlist L43-44: `productId` not validated to exist.
     - /api/downloads/[orderItemId]: requires auth + ownership ✓.

5.8  Admin API routes accept arbitrary body fields via `parseBody<any>` with
     only ad-hoc "is required" checks — no zod schemas. Notable:
     - /api/admin/orders POST L72-101: `items: any[]`; `it.price` and `it.total`
       are taken from the request body verbatim (no re-lookup against the
       actual product/kit price). A compromised admin can create a ৳0 order
       for a ৳10000 product.
     - /api/admin/users POST/PUT L80, L68: `role` not validated against an
       enum (CUSTOMER/ADMIN/STAFF). Admin can set role to any arbitrary
       string.
     - /api/admin/coupons POST L88: `type` defaults to 'PERCENTAGE' if
       missing but isn't validated to be in {PERCENTAGE, FIXED} if supplied.

5.9  No SQL injection risk — every DB access goes through Prisma's
     parameterized query API. Grep for `$queryRaw|$executeRaw|$queryRawUnsafe|
     $executeRawUnsafe` returned zero matches across src/app/api. ✓

5.10 All admin API routes verified protected with `requireAdmin()`. Grep
     across src/app/api/admin shows every GET/POST/PUT/DELETE handler
     calls `requireAdmin()` and bails on `!auth.ok`. ✓

== 6. STOREFRONT DEAD BUTTONS / HANDLERS ==

6.1  src/components/epf/Footer.tsx — multiple dead links:
     - L6   "About Us"          → /about   (route does not exist)
     - L7   "Delivery Information" → "#"
     - L8   "Terms & Conditions" → "#"
     - L9   "Help Center"       → "#"
     - L10  "Returns & Refunds" → "#"
     - L34  "Newsletter"        → "#"
     - L96  All 4 social icons (Facebook/Twitter/Instagram/YouTube) → "#"

6.2  src/app/admin/login/page.tsx L198 — "Forgot password?" link → "#".

6.3  src/app/login/page.tsx L187 — "পাসওয়ার্ড ভুলে গেছেন?" (Forgot password?)
     link → "#".

6.4  src/components/epf/Header.tsx — category mega-menu (L429-446 and
     L451-461 and L470-476): every category and sub-category link goes to
     `/shop` with NO category filter applied. Clicking "Cables & Wires",
     "Solar Equipment", "PVC Cables", etc. all just open the full shop.
     Not a crash, but the entire mega-menu is functionally a single button.

6.5  src/components/epf/Header.tsx L108-121 — fetches
     `/api/products?countOnly=true` and reads `data.categories`, but the
     API returns `{ data: { total } }` (no `categories` field). So the
     `categoryCounts` state is always `{}` and every category badge in the
     mega-menu (L443) shows "0".

6.6  src/app/projects/[slug]/page.tsx L91-93 — three share buttons
     (Facebook/Twitter/Image) have NO `onClick` and NO `href`. They are
     non-functional decorations.

6.7  src/app/order-track/page.tsx — functionally OK; calls
     /api/orders/track with orderNumber + phone. All buttons work.

== 7. CART / ORDER FLOW ==

7.1  src/store/cart-store.ts L24-34 — `toOrderItemPayload` correctly routes
     PROJECT items to `{ itemType, projectId: item.productId, quantity }`.
     PRODUCT items keep `productId` + optional `variantId`. SERVICE items
     use `serviceId`. ✓

7.2  src/app/api/orders/route.ts L107-113 — PROJECT branch correctly looks
     up `db.projectKit.findUnique({ where: { id: item.projectId } })`
     (NOT db.project). Verifies `kit.isActive`. Reads `kit.salePrice ??
     kit.price ?? 0`. Stores `projectId: item.projectId || null` on the
     OrderItem. ✓

7.3  CartItem schema (schema.prisma L194-220) — `projectId String? @map("kit_id")`
     with relation `kit ProjectKit? @relation(fields: [projectId], references: [id])`.
     Field name "projectId" is misleading (it actually references ProjectKit.id)
     but the relation is correct. ✓

7.4  OrderItem schema (L350-379) — same pattern: `projectId String? @map("kit_id")`
     with `kit ProjectKit?` relation. ✓

7.5  src/app/api/orders/route.ts L103 — `unitPrice = service.salePrice ??
     service.basePrice` — Service has no `salePrice` field. See §3.1
     (build-breaking TS error; runtime falls back to basePrice).

7.6  src/app/api/orders/route.ts L137-147 — lineItems.push() stores
     `productId: item.productId || null` for ALL itemTypes. For a PROJECT
     item, the cart-store sends only `projectId` (not `productId`), so
     `item.productId` is undefined → stored as null. ✓ (No crash, correct
     null.)

7.7  src/app/api/admin/orders/route.ts POST L137-152 — admin-side order
     creation accepts items with arbitrary price/total (no re-validation
     against actual product/kit prices). See §5.8.

== 8. PAYMENT FLOW ==

8.1  src/app/api/payments/initiate/route.ts — **broken auth**, see §5.2.
     The route "works" only for callers passing `Authorization: Bearer
     <token>`, which the storefront never does. Every storefront payment
     initiation will 401.

8.2  src/lib/payments.ts L77-90 (SSLCommerz test-mode) returns
     `paymentUrl: /api/payments/sslcommerz/ipn?status=SUCCESS&token=...`
     (relative URL). CheckoutDialog / checkout page do
     `window.location.href = pay.paymentUrl` — a relative URL works for
     navigation. ✓ But the bKash test-mode (L168-176) returns
     `paymentUrl: /api/payments/bkash/callback?status=success&...` and the
     Nagad test-mode (L273-280) returns
     `paymentUrl: /api/payments/nagad/callback?status=Success&...`.
     The bkash/callback/route.ts L5 only implements `POST` (no GET), so a
     GET redirect from test-mode would 405 Method Not Allowed. The
     nagad/callback/route.ts L5 is the same — POST only, no GET. So bKash
     and Nagad test-mode payments cannot complete.

8.3  src/app/api/payments/sslcommerz/ipn/route.ts — implements both POST
     (real IPN) and GET (test-mode token redirect). The GET handler uses
     `consumeTestPaymentToken` (one-time token) and updates the order to
     PAID/CONFIRMED. ✓

8.4  src/app/api/payments/bkash/callback/route.ts and nagad/callback/route.ts
     — both are POST-only. No GET handler for test-mode redirects. See §8.2.

8.5  All three callback routes (sslcommerz/bkash/nagad) trust the gateway's
     `body.tran_id` / `body.paymentID` / `body.payment_ref_id` and look up
     the Payment row by transactionId. The validate*() functions in
     src/lib/payments.ts L128-158, L223-263, L314-342 will return
     `{ success: true }` in test-mode without verifying the payment
     actually happened. In production, they call the gateway's validation
     API — but the validation is keyed off the gateway-supplied transaction
     id, so a forged callback with a known transactionId could mark an
     order as PAID. The transactionId is generated server-side (in
     initiate*Payment), but it follows a predictable pattern
     (`SSL-${Date.now()}-${random6}`, `BK-${Date.now()}-${random6}`,
     `NG-${Date.now()}-${random6}`) — Date.now() is guessable, the random6
     is only 6 chars of base36 (~2.2 billion possibilities). Acceptable but
     not ideal. Recommended: verify the gateway's signature/hash in
     production callbacks.

== 9. ADDITIONAL FINDINGS ==

9.1  src/app/api/orders/track/route.ts L19-23 — uses
     `customerPhone: { contains: phone }` for lookup. This means a
     single-digit phone query (e.g. "5") would match any order whose phone
     contains "5". Not a security hole (since the orderNumber must also
     match exactly), but the partial-match on phone is unnecessary and
     could leak order info if the orderNumber is also guessable. Should be
     exact match: `customerPhone: phone`.

9.2  src/app/api/downloads/[orderItemId]/route.ts L48 — redirects to
     `item.product.digitalFile` (a stored URL/path) with a 302. The comment
     at L43-44 admits this should be a signed URL in production. Currently
     any logged-in user who has purchased a digital product can share the
     redirect URL and bypass the download-limit counter (the counter is
     incremented before the redirect, but the URL itself is reusable).
     Also, if `digitalFile` is a local file path, NextResponse.redirect()
     will fail (only absolute URLs work). The schema comment at L137-138
     says digitalFile is a PRIVATE path — but redirecting to a private path
     doesn't serve the file.

9.3  src/app/api/admin/orders/[id]/route.ts DELETE L150-168 — hard-deletes
     an order and its items/history/shipment/payments. This is irreversible
     and loses all audit trail. Most other admin DELETE routes use
     soft-delete (isDeleted=true). Inconsistent and dangerous.

9.4  src/app/api/admin/ai-providers/route.ts POST L94-117 — when
     `isDefault: true`, bumps ALL existing providers' sortOrder by 1 in a
     transaction. If two admins create default providers concurrently, the
     sortOrders could collide (both new providers get sortOrder=0 and the
     old ones get bumped twice). Low-risk but worth noting.

9.5  src/app/api/admin/ai-providers/[id]/models/route.ts L64 — uses
     `requireAdmin()` (✓) but I did not review the model-fetching logic in
     detail. Flagging for follow-up if AI provider model management is in
     scope.

9.6  src/app/api/admin/security/* routes — all use `requireAdmin()` (✓).
     Did not review in detail; flagging for a follow-up security-specific
     audit if needed.

9.7  Multiple admin POST/PUT routes use `parseBody<any>` and then destructure
     fields with no schema validation. This is consistent across the entire
     admin API surface. A single zod-schema-per-endpoint refactor would
     close most of the §5.8 validation gaps.

9.8  src/app/api/orders/route.ts POST accepts guest orders (no auth
     required). The order is attached to a user only if a session is
     present (L194-205). This means an authenticated user's cart can be
     "stolen" by an attacker who knows the cart contents — but since the
     cart is client-side (zustand persist), this is acceptable. However,
     there's no CSRF protection on the POST — an attacker could craft a
     cross-origin form POST to /api/orders and create orders on behalf of
     an authenticated user (the cookie would be sent automatically).
     Mitigated by SameSite=lax on the session cookie (auth.ts L55), which
     blocks cross-site POSTs. ✓ (Assuming the cookie's SameSite attribute
     is respected by the browser.)

9.9  src/app/api/contact/route.ts L23-32 — stores `email` and `phone`
     from the request body without sanitization. The Contact table allows
     arbitrary strings. Stored XSS is unlikely (these fields are rendered
     as text in admin tables), but the admin messages page should still
     HTML-escape user-supplied content. Did not verify the admin messages
     UI.

== SUMMARY OF CRITICAL / HIGH-PRIORITY ISSUES ==

CRITICAL:
- §5.1  /api/settings leaks ALL payment-gateway secrets (bkashApiKey,
  bkashSecretKey, nagadApiKey, nagadSecretKey, sslcommerzStorePassword) to
  anonymous callers.
- §5.2  /api/payments/initiate uses Bearer-only auth that the storefront
  never sends → all online payment flows 401 for cookie-session users.
- §3.1  /api/orders/route.ts L103 references Service.salePrice (non-existent
  field) → TypeScript build error under strict mode.

HIGH:
- §3.2  /api/admin/project-kits/[id]/items/[itemId]/route.ts destructures
  `kitId` from params but the param is named `id` → cross-kit item
  modification/deletion possible (kitId never verified).
- §1.1-1.5  Stale isSellable/price/salePrice references on Project across
  admin form, public listing, and public detail pages.
- §4.3  Storefront-wide `comparePrice` field is never returned by the API
  → discount badges, strikethrough prices, and the entire /deals page are
  broken.
- §5.4-5.6  No rate limiting on auth routes, public AI endpoint, or public
  POST routes → brute-force / spam-abuse vectors.

MEDIUM:
- §8.2  bKash and Nagad test-mode callbacks are POST-only — test-mode GET
  redirects 405.
- §9.3  Admin order DELETE is hard-delete (irreversible, loses audit trail).
- §6.1-6.3  Multiple dead "#" links in Footer, admin/login, login.
- §6.4-6.5  Header mega-menu doesn't filter by category; category counts
  always show "0".
- §2.9  /project-kits rating filter is non-functional (ProjectKit has no
  rating field).

LOW:
- §5.8  Admin routes lack zod schemas (accept arbitrary body fields).
- §5.7  Public routes lack email/phone format validation.
- §9.1  Order-track uses partial phone match (should be exact).
- §9.2  Digital download redirect URL is reusable (no signed URL).
- §1.4  Stale doc-comment in /api/admin/projects/route.ts.
- §3.3  Dead `fullAddress` variable in /api/orders/route.ts.
- §5.3  Missing non-null assertion on `auth.response` in payment route.
---

---
Task ID: PHASE4-5
Agent: Migration Agent
Task: Migrate 41 remaining API routes to Zod validation

Work Log:
- Read /home/z/my-project/worklog.md (prior audit context).
- Read /home/z/my-project/src/lib/api-handler.ts to confirm available exports:
  `withErrorHandling` (was NOT exported — had to add `export`),
  `validateBody`, `adminRoute`, `adminGetRoute`, `authRoute`, `authGetRoute`,
  `publicRoute`, `publicGetRoute`, `schemas`, `z`.
- Migrated each of the 41 listed routes by:
  • Defining a Zod schema at the top of each file matching the body fields the
    handler destructures (with `.optional()` for non-required fields and
    `.passthrough()` for backward compatibility).
  • Replacing `parseBody<any>(request)` with `validateBody(request, schema)`
    for routes with dynamic `[id]` params, wrapped in `withErrorHandling`.
  • Using the wrapper helpers (`adminRoute`, `adminGetRoute`, `authRoute`,
    `authGetRoute`) for routes without URL params.
  • Replacing the previous per-handler try/catch + errorResponse(500) fallbacks
    with the central `withErrorHandling` wrapper (Zod errors → 400,
    auth errors → propagated, all other errors → 500 without leaking stack).
  • Removing now-unused `parseBody` imports; preserving all business logic
    verbatim (uniqueness checks, soft/hard delete semantics, status
    transitions, alias-field mappings like `discount`↔`value`,
    `isActive`↔`enabled`, etc.).
  • For GET/DELETE handlers without bodies, switched to `adminGetRoute`/
    `authGetRoute`/`withErrorHandling` so auth + error handling is unified.

Files migrated (41 total):
- src/app/api/admin/ai-providers/[id]/route.ts
- src/app/api/admin/ai-providers/route.ts
- src/app/api/admin/banners/[id]/route.ts
- src/app/api/admin/banners/route.ts
- src/app/api/admin/blog/[id]/route.ts
- src/app/api/admin/blog/route.ts
- src/app/api/admin/bookings/[id]/route.ts
- src/app/api/admin/bookings/route.ts
- src/app/api/admin/brands/[id]/route.ts
- src/app/api/admin/brands/route.ts
- src/app/api/admin/coupons/[id]/route.ts
- src/app/api/admin/coupons/route.ts
- src/app/api/admin/flash-sales/[id]/route.ts
- src/app/api/admin/flash-sales/route.ts
- src/app/api/admin/messages/[id]/route.ts
- src/app/api/admin/orders/[id]/route.ts
- src/app/api/admin/orders/route.ts
- src/app/api/admin/product-categories/[id]/route.ts
- src/app/api/admin/product-categories/route.ts
- src/app/api/admin/product-questions/[id]/answer/route.ts
- src/app/api/admin/projects/[id]/route.ts
- src/app/api/admin/projects/route.ts
- src/app/api/admin/quote-requests/[id]/route.ts
- src/app/api/admin/returns/[id]/route.ts
- src/app/api/admin/reviews/[id]/route.ts
- src/app/api/admin/security/ip-rules/route.ts
- src/app/api/admin/security/unlock-ip/route.ts
- src/app/api/admin/service-categories/[id]/route.ts
- src/app/api/admin/service-categories/route.ts
- src/app/api/admin/services/[id]/route.ts
- src/app/api/admin/services/route.ts
- src/app/api/admin/shipments/[id]/route.ts
- src/app/api/admin/shipments/[id]/status/route.ts
- src/app/api/admin/shipments/route.ts
- src/app/api/admin/taxes/[id]/route.ts
- src/app/api/admin/taxes/route.ts
- src/app/api/admin/users/[id]/route.ts
- src/app/api/admin/users/route.ts
- src/app/api/auth/profile/route.ts
- src/app/api/orders/[id]/return/route.ts
- src/app/api/wishlist/route.ts

Incidental fix:
- src/lib/api-handler.ts: exported `withErrorHandling` (was a private helper).
  The task spec required routes-with-params to use `withErrorHandling +
  validateBody`, so the export was mandatory. All previously-migrated
  project-kit routes also depend on this import.
- src/app/api/admin/project-kits/[id]/items/route.ts: removed a bogus
  `withErrorHandlingWrapper` import (left behind by a prior migration) that
  referenced a non-existent export. Replaced with the correct `withErrorHandling`
  import (this was breaking tsc and was on the same critical path).

Stage Summary:
- 41 files migrated to Zod-validated handlers.
- All 41 migrated files compile cleanly under `tsc --noEmit` (verified).
- All business logic preserved — no behavior changes, only validation +
  error-handling plumbing was swapped.
- Used `.passthrough()` on every schema for backward compatibility so any
  extra/legacy fields clients send are not stripped.
- Used `.optional()` (and `.nullable()` where the original code allowed
  nulls) for every non-required body field, preserving prior semantics.
- GET/DELETE handlers without bodies use the no-body wrappers
  (`adminGetRoute` / `authGetRoute`) so the same `withErrorHandling`
  error-formatting applies.
- Remaining TypeScript errors in the repo are all in files OUTSIDE this
  task's 41-file list and predate this work (e.g. Prisma `projectKit`/`isBestDeal`
  schema mismatches in already-migrated routes, and `PublicHandler<unknown>` /
  `AuthHandler<unknown>` inference issues in `auth/login`, `auth/register`,
  `auth/change-password`, `contact`, `newsletter`, `quote-requests`, `reviews`,
  `services/book`). Those routes were migrated by earlier agents with explicit
  `{ field: any }` destructuring annotations that conflict with the inferred
  `unknown` `T`; they need a separate cleanup pass but are not in scope here.
---

---
Task ID: ROADMAP-COMPLETE
Agent: Roadmap Completion Agent
Task: Complete remaining Week 1, 3, 4 roadmap items

Work Log:

TASK 1 — Week 3 Cache Integration (5 public + 8 admin routes)
- Read /home/z/my-project/src/lib/cache.ts to confirm the `cache`/`cacheKeys`
  API shape (getOrSet, del, invalidatePattern) and the canonical cache-key
  builders (products(page,limit,search), projectKits(), services(),
  blogPosts(limit), banners(type), brands(), categories()).
- Public read-through cache wrapping (TTL per spec):

  1. src/app/api/products/route.ts
     - Added `import { cache, cacheKeys } from '@/lib/cache'`.
     - Wrapped the findMany+count `Promise.all` (and the where/orderBy
       construction, including the async category lookup) inside
       `cache.getOrSet(cacheKeys.products(page, limit, search), 120, …)`
       so cache hits skip the category resolution entirely. Returns
       `{ products, total }` from the fetcher to keep tuple typing clean.
     - countOnly branch left uncached (separate cheap query).

  2. src/app/api/project-kits/route.ts
     - Wrapped findMany with `cache.getOrSet(cacheKeys.projectKits(), 300, …)`.

  3. src/app/api/services/route.ts
     - Wrapped findMany (plus async service-category lookup) with
       `cache.getOrSet(cacheKeys.services(), 300, …)`.

  4. src/app/api/blog/route.ts
     - Wrapped the findMany+count `Promise.all` with
       `cache.getOrSet(cacheKeys.blogPosts(limit), 300, …)`. Returns
       `{ posts, total }` from the fetcher for clean destructuring.

  5. src/app/api/banners/route.ts
     - Wrapped findMany with `cache.getOrSet(cacheKeys.banners(type), 300, …)`.

- Admin write-side cache invalidation (inserted immediately BEFORE the
  final `return jsonResponse(...)` of each handler):

  1. src/app/api/admin/products/route.ts        POST  → cache.invalidatePattern('products:*')
  2. src/app/api/admin/products/[id]/route.ts   PUT   → cache.invalidatePattern('products:*')
                                                  DELETE → cache.invalidatePattern('products:*')
  3. src/app/api/admin/brands/route.ts          POST  → cache.del('brands:all')
  4. src/app/api/admin/brands/[id]/route.ts     PUT   → cache.del('brands:all')
                                                  DELETE → cache.del('brands:all')
  5. src/app/api/admin/product-categories/route.ts    POST → cache.del('product-categories:all')
  6. src/app/api/admin/product-categories/[id]/route.ts PUT → cache.del('product-categories:all')
                                                  DELETE → cache.del('product-categories:all')
  7. src/app/api/admin/project-kits/route.ts    POST  → cache.del('project-kits:active')
  8. src/app/api/admin/project-kits/[id]/route.ts PUT → cache.del('project-kits:active')
                                                  DELETE → cache.del('project-kits:active')

  Each admin file received `import { cache } from '@/lib/cache'` at the top.

TASK 2 — Week 1 Performance Spans (5 slowest routes)
- Added `import { startSpan } from '@/lib/monitoring'` and wrapped the main
  DB query in each route with `const span = startSpan('<name>')` +
  `span.finish()`. Used try/finally where the query is awaited so the span
  always finishes even on throw (the withErrorHandling wrapper re-throws
  after captureError).

  1. src/app/api/products/route.ts        → startSpan('products.list')    (around findMany+count, inside cache closure)
  2. src/app/api/admin/products/route.ts  → startSpan('admin.products.list') (around findMany+count, try/finally)
  3. src/app/api/orders/route.ts          → startSpan('orders.create')   (around db.order.create)
  4. src/app/api/admin/orders/route.ts    → startSpan('admin.orders.list') (around findMany+count, try/finally)
  5. src/app/api/settings/route.ts        → startSpan('settings.get')    (around siteSettings.findUnique/create, inside cache closure, try/finally)

  NOTE: items #1, #2, #5 also received cache integration in TASK 1, so the
  span was placed inside the cache fetcher closure (correct — we only want
  to measure the actual DB query, not the cache lookup).

TASK 3 — Week 4 TypeScript Strict Mode
- Read tsconfig.json and next.config.ts baselines:
    tsconfig.json:  "noImplicitAny": false  (strict: true was already on)
    next.config.ts: typescript.ignoreBuildErrors = true
- Flipped both:
    tsconfig.json:  "noImplicitAny": true
    next.config.ts: typescript.ignoreBuildErrors = false
- Ran `npx tsc --noEmit` → 99 errors total (> 50 threshold).
- Per task spec, REVERTED both changes:
    tsconfig.json:  "noImplicitAny": false  (back to baseline)
    next.config.ts: typescript.ignoreBuildErrors = true (back to baseline, with a comment documenting the 99-error finding)
- Baseline error count (noImplicitAny:false) verified at 96 — i.e. enabling
  noImplicitAny only adds 3 new errors. The vast majority of the 99 are
  PRE-EXISTING (Prisma client not regenerated for ProjectKit/ProjectKitItem
  models; missing optional deps: ioredis, cloudinary, @sentry/nextjs,
  vitest; missing `z` import in src/lib/api-handler.ts; PublicHandler<unknown>
  generic-inference issues in 7 already-migrated routes). These are tracked
  in earlier worklog entries and are out of scope for this task.

Stage Summary:
- 13 files modified for cache + span work (5 public + 6 admin + 2 admin
  files that got both cache + span):
    • src/app/api/products/route.ts                  (cache + span)
    • src/app/api/project-kits/route.ts              (cache)
    • src/app/api/services/route.ts                  (cache)
    • src/app/api/blog/route.ts                      (cache)
    • src/app/api/banners/route.ts                   (cache)
    • src/app/api/admin/products/route.ts            (cache invalidate + span)
    • src/app/api/admin/products/[id]/route.ts       (cache invalidate)
    • src/app/api/admin/brands/route.ts              (cache invalidate)
    • src/app/api/admin/brands/[id]/route.ts         (cache invalidate)
    • src/app/api/admin/product-categories/route.ts  (cache invalidate)
    • src/app/api/admin/product-categories/[id]/route.ts (cache invalidate)
    • src/app/api/admin/project-kits/route.ts        (cache invalidate)
    • src/app/api/admin/project-kits/[id]/route.ts   (cache invalidate)
    • src/app/api/orders/route.ts                    (span)
    • src/app/api/admin/orders/route.ts              (span)
    • src/app/api/settings/route.ts                  (span)
- 2 config files flipped for TASK 3 then reverted:
    • tsconfig.json     (noImplicitAny: false → true → false)
    • next.config.ts    (ignoreBuildErrors: true → false → true)
- Re-ran `tsc --noEmit` after all changes (with noImplicitAny:false): the
  errors in modified files are 100% pre-existing Prisma-client / generic-
  inference issues (projectKit, projectKitItem, isBestDeal, lineItems.push
  never[]). No NEW errors were introduced by this task.
- Cache key note: the products cache key (`cacheKeys.products(page, limit,
  search)`) intentionally omits category/brandId/featured/sort/price/rating
  filters per the task spec. The where-clause construction was moved INSIDE
  the cache closure so a cache miss still applies all server-side filters
  correctly; the cache key choice is a known limitation called out in the
  file's header comment.
---
