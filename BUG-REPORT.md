# ePowerFix — Full Bug Report & Solution Guide

**Total: 60 bugs — 13 CRITICAL, 15 HIGH, 20 MEDIUM, 11 LOW**

---

## 🔴 CRITICAL (13 bugs)

### C1 ❌ FALSE ALARM — Header.tsx Icons
- **Status**: NOT A BUG — `EPFIcons.Truck`, `User`, `Heart` etc. all exist in `EPFIcons` object
- **File**: `src/components/epf/Header.tsx`

### C2 ✅ FIXED — Shop Page Pagination Always 0
- **File**: `src/app/shop/page.tsx:74-84, 876-877`
- **Problem**: API `listResponse()` returns `{ data: { data, total, page, limit, totalPages } }` — no `pagination` key. Frontend accesses `data?.data?.pagination?.total` → always `undefined`, so pagination never works.
- **Solution**: Changed `ProductsResponse` type to match actual API shape (`total`, `totalPages` at top level of `data`), and fixed access: `data?.data?.total` and `data?.data?.totalPages`.

### C3 ✅ FIXED — Profile Page Orders & Returns Always Empty
- **File**: `src/app/profile/page.tsx:183-195`
- **Problem**: API returns `{ data: [orders] }` but frontend typed as `{ data: { data: Order[] } }` and accessed `data.data.data` → `undefined`.
- **Solution**: Fixed types to `{ data: Order[] }` and access `ordersEnvelope?.data`.

### C4 ⏳ — Product Create Always Fails (Zod)
- **File**: `src/app/api/admin/products/route.ts:40-41`
- **Problem**: Schema has `categoryId: z.string().min(1)` and `brandId: z.string().min(1)`. When admin selects "None", form sends `null` → Zod rejects.
- **Solution**:
  ```ts
  // Change schema:
  categoryId: z.string().min(1).nullable().optional(),
  brandId: z.string().min(1).nullable().optional(),

  // In create handler:
  categoryId: categoryId || null,
  brandId: brandId || null,
  ```
- **Also fix**: `src/app/api/admin/products/[id]/route.ts` PUT handler same issue.

### C5 ⏳ — Book Service Page Always "Not Found"
- **File**: `src/app/book-service/[id]/page.tsx:61`
- **Problem**: URL param is `[id]` but service links pass `slug` (e.g. "home-wiring"). Code does `services.find(s => s.id === serviceId)` — UUID vs slug → never matches.
- **Solution**: Change find to also match by slug:
  ```ts
  const found = services.find((s: Service) => s.id === serviceId || s.slug === serviceId);
  ```

### C6 ⏳ — Product Detail Missing ChatWidget
- **File**: `src/app/product/[id]/page.tsx`
- **Problem**: "Message Seller" button calls `setChatOpen(true)` but `<ChatWidget />` is not rendered on this page.
- **Solution**: Add imports and render:
  ```tsx
  import ChatWidget from "@/components/epf/ChatWidget";
  import BackToTopButton from "@/components/epf/BackToTopButton";
  // Add before closing </div>:
  <ChatWidget />
  <BackToTopButton />
  ```

### C7 ⏳ — FlashDeals Click Goes to Wrong Page
- **File**: `src/components/epf/FlashDeals.tsx:82-84`
- **Problem**: Every flash deal product card onClick does `window.location.href = "/best-deals"` instead of navigating to the actual product.
- **Solution**:
  ```ts
  // Change onClick to:
  onClick={() => window.location.href = `/shop/${product.id}`}
  ```

### C8 ⏳ — Wishlist Page Has No Layout
- **File**: `src/app/wishlist/page.tsx`
- **Problem**: Page renders bare content without `<Header />`, `<Footer />`, `<CartDrawer />`, `<ChatWidget />`, `<BackToTopButton />`.
- **Solution**: Wrap with standard layout components:
  ```tsx
  import Header from "@/components/epf/Header";
  import Footer from "@/components/epf/Footer";
  import CartDrawer from "@/components/epf/CartDrawer";
  import ChatWidget from "@/components/epf/ChatWidget";
  import BackToTopButton from "@/components/epf/BackToTopButton";

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">...existing content...</main>
      <ChatWidget />
      <BackToTopButton />
      <CartDrawer />
      <Footer />
    </div>
  );
  ```

### C9 ✅ FIXED — Settings Page Response Shape Mismatch
- **File**: `src/app/api/admin/settings/route.ts:176`
- **Problem**: GET handler used `mapSettings()` returning nested keys (`description`, `logo`, `socialLinks.facebook`), but admin Settings page reads flat keys (`siteTagline`, `logoUrl`, `facebookUrl`). All settings showed as defaults.
- **Solution**: Changed GET to return raw DB settings: `return jsonResponse({ data: settings })` (no mapSettings).

### C10 ✅ FIXED — Media Library GET/DELETE Missing
- **File**: `src/app/api/admin/upload/route.ts`, new `src/app/api/admin/upload/[filename]/route.ts`
- **Problem**: Only POST existed. Media Library couldn't list or delete files.
- **Solution**: Added GET handler (lists files from `public/uploads/` with metadata) and created `[filename]/route.ts` with DELETE handler (validates filename, deletes from disk).

### C11 ✅ FIXED — Cache Poisoning (4 routes)
- **Files**: `src/app/api/products/route.ts`, `services/route.ts`, `project-kits/route.ts`, `blog/route.ts`
- **Problem**: Cache keys ignored filter params (category, brand, sort, search, page). First request for any page/search combo got cached and served for ALL subsequent different filter requests.
- **Solution**: Extracted fetch logic into separate functions. When any extra filter param is present, skip cache and fetch directly from DB.

### C12 ✅ FIXED — Product Queries Tab Hardcoded
- **File**: `src/app/product/[id]/page.tsx`
- **Problem**: "Product Queries (0)" tab was hardcoded with count 0 and no implementation.
- **Solution**: Removed the tab entry and its content section entirely until the feature is properly implemented.

---

## 🟠 HIGH (15 bugs)

### H1 ⏳ — Mega Menu Categories Don't Filter
- **File**: `src/components/epf/Header.tsx:442-466`
- **Problem**: All mega menu category links go to plain `/shop` ignoring `cat.dbSlug`.
- **Solution**: `window.location.href = '/shop?category=${cat.dbSlug || cat.slug}'`

### H2 ⏳ — Compare "Add to Cart" Adds ALL Products
- **File**: `src/app/compare/page.tsx:96-102`
- **Problem**: Button inside per-product row does `products.forEach(p => addItem(...))` — adds every compared product.
- **Solution**: Change to add only the clicked product:
  ```ts
  onClick={() => addItem({ productId: p.id, productName: p.name, price: p.salePrice || p.price, productImage: p.images?.[0] || '', quantity: 1 })}
  ```

### H3 ⏳ — Product Detail Heart & Share Buttons Non-functional
- **File**: `src/app/product/[id]/page.tsx:307-313`
- **Problem**: `<button>` elements with no onClick handlers.
- **Solution**:
  - Heart: Use `WishlistButton` component or toggle wishlist via API
  - Share: `navigator.clipboard.writeText(window.location.href); toast.success('Link copied!')`

### H4 ⏳ — "Ask About This Product" No Handler
- **File**: `src/app/product/[id]/page.tsx:347`
- **Problem**: Styled as clickable but `<span>` with no onClick.
- **Solution**: Add `onClick={() => useUIStore.getState().setChatOpen(true)}` and ensure ChatWidget is rendered (C6).

### H5 ⏳ — Order Track Page Broken
- **File**: `src/app/order-track/page.tsx:58-152`
- **Problems**: (1) Missing ChatWidget/BackToTopButton (2) Timeline connector parent not `relative` (3) CANCELLED/PROCESSING status not in statusSteps → findIndex returns -1
- **Solution**:
  1. Add missing overlay components
  2. Add `relative` to timeline parent div
  3. Add CANCELLED, PROCESSING, RETURNED to statusSteps or show special UI

### H6 ⏳ — ServiceBookingDialog API Mismatch
- **File**: `src/components/epf/ServiceBookingDialog.tsx:64-68`
- **Problem**: Fetches `/api/services?category=all` and reads `data.services` but API returns `data.data.services`.
- **Solution**: `const services = data?.data?.services || data?.services || [];`

### H7 ⏳ — Checkout Total Can Go Negative
- **File**: `src/app/checkout/page.tsx:106`, `src/components/epf/CheckoutDialog.tsx:75`
- **Problem**: `subtotal + delivery - discount` can go negative if discount > subtotal + delivery.
- **Solution**: `const total = Math.max(0, subtotal + delivery - discount);`

### H8 ⏳ — Register Page Admin Redirect
- **File**: `src/app/register/page.tsx:127`
- **Problem**: After registration, if response says role=ADMIN, redirects to `/admin`. Normal users shouldn't get admin access.
- **Solution**: Always redirect to `/` for customer registrations. Admin only via `/admin/login`.

### H9 ⏳ — WishlistButton Uses alert()
- **File**: `src/components/WishlistButton.tsx:25`
- **Problem**: `alert("Please login first")` breaks UI consistency.
- **Solution**: Replace with `toast.error("Please login to save favorites")` and `router.push("/login")`.

### H10 ⏳ — Payment Callbacks No Signature Verification
- **Files**: `src/app/api/payments/bkash/callback/`, `nagad/callback/`, `sslcommerz/ipn/`
- **Problem**: No gateway signature/hash verification. Fake callback could mark orders as PAID.
- **Solution**: Add signature verification per gateway docs. Add IP whitelisting for callback endpoints.

### H11 ⏳ — Payment Initiate No Ownership Check
- **File**: `src/app/api/payments/initiate/route.ts:34-36`
- **Problem**: After auth, fetches order by ID but never checks `order.userId === user.id`.
- **Solution**: `if (order.userId && order.userId !== auth.user!.id) return errorResponse('Forbidden', 403)`

### H12 ⏳ — Order Return No Status Validation
- **File**: `src/app/api/orders/[id]/return/route.ts:28-45`
- **Problem**: Return request allowed for ANY order status (PENDING, CANCELLED, etc.)
- **Solution**:
  ```ts
  if (!['DELIVERED', 'CONFIRMED'].includes(order.status))
    return errorResponse('Cannot return this order', 400)
  ```

### H13 ⏳ — Coupon Discount Mismatch (Client vs Server)
- **Files**: `src/components/epf/CheckoutDialog.tsx:142`, `src/app/api/orders/route.ts:163-164`
- **Problem**: Client sends `orderTotal = subtotal + delivery` to coupon API. Server calculates discount on `subtotal` only. Different amounts shown vs charged.
- **Solution**: Make both use same base. Update coupon validation to document which total, and match client calculation.

### H14 ⏳ — Staff Creation Fails When Phone Empty
- **File**: `src/app/api/admin/users/route.ts:33`, `src/app/admin/staff/page.tsx:75`
- **Problem**: Schema: `phone: z.string().min(1)`. Form sends `null` for empty phone → Zod rejects.
- **Solution**: `phone: z.string().min(1).optional().nullable().default('')`

### H15 ⏳ — Security Page Uses axios Instead of apiFetch
- **File**: `src/app/admin/security/page.tsx:4`
- **Problem**: `import api from '@/lib/axios'` while all other pages use `apiFetch`.
- **Solution**: Refactor to use `apiFetch` from `@/lib/api`.

---

## 🟡 MEDIUM (20 bugs)

### M1 ⏳ — Announcement Bar No Marquee Animation
- **File**: `src/components/epf/AnnouncementBar.tsx:21-22`
- **Problem**: Messages duplicated for marquee intent but no CSS `@keyframes` animation exists. Messages just hidden by `overflow-hidden`.
- **Solution**: Add CSS animation:
  ```css
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .announce-bar { animation: marquee 30s linear infinite; }
  ```

### M2 ⏳ — MobileBottomNav Search Scrolls to Top
- **File**: `src/components/epf/MobileBottomNav.tsx:68`
- **Problem**: Search button does `window.scrollTo({ top: 0 })` — doesn't open search.
- **Solution**: Dispatch a custom event to open header search, or navigate to `/shop?search=`.

### M3 ⏳ — Blog Page Missing BackToTopButton
- **File**: `src/app/blog/page.tsx`
- **Problem**: Missing `<BackToTopButton />` present on all other pages.
- **Solution**: Add `<BackToTopButton />` before closing `</>`.

### M4 ⏳ — Cost Estimator Hardcoded Data
- **File**: `src/app/cost-estimator/page.tsx:72-120`
- **Problem**: 10+ hardcoded services with fixed prices. Submit doesn't call any API.
- **Solution**: Fetch from `/api/services` for prices. Submit to `/api/quote-requests`.

### M5 ⏳ — Compare Page Missing Components (early return)
- **File**: `src/app/compare/page.tsx:72-83`
- **Problem**: When < 2 products, missing ChatWidget and BackToTopButton.
- **Solution**: Add `<ChatWidget />` and `<BackToTopButton />` to the early-return JSX.

### M6 ⏳ — WishlistButton Used on Services (Wrong Entity)
- **File**: `src/app/services/page.tsx:109, 210`
- **Problem**: `WishlistButton productId={service.id}` on service cards. Creates orphan entries.
- **Solution**: Remove WishlistButton from service cards, or create separate service favorites.

### M7 ⏳ — Best Deals → Deals Redirect
- **File**: `src/app/best-deals/page.tsx`
- **Problem**: `/best-deals` redirects to `/deals`. Two URLs for same content.
- **Solution**: Remove `/best-deals` redirect page and update all links to use `/deals` directly.

### M8 ⏳ — Payment Fail router.back()
- **File**: `src/app/payment/fail/page.tsx:33`
- **Problem**: `router.back()` may navigate away from the site.
- **Solution**: `router.push("/checkout")` or `router.push("/shop")`.

### M9 ⏳ — SiteThemeProvider Hydration Flash
- **File**: `src/components/SiteThemeProvider.tsx:41-53`
- **Problem**: Direct DOM mutation in useEffect causes visible flash of default → configured theme.
- **Solution**: Use CSS custom properties in layout `<style>` tag or accept as trade-off.

### M10 ⏳ — Checkout Area Shipping Detection Fragile
- **File**: `src/app/checkout/page.tsx:101`
- **Problem**: Regex `dhaka` matching catches "New Dhaka City" etc.
- **Solution**: Stricter area matching or proper area-to-zone mapping table.

### M11 ⏳ — Product Detail "Inhouse Product" Always Shows
- **File**: `src/app/product/[id]/page.tsx:425`
- **Problem**: Hardcoded badge, not data-driven.
- **Solution**: Add `isInHouse` field to Product, or remove badge.

### M12 ⏳ — ShopSection Kits Open Dialog Instead of Navigate
- **File**: `src/components/epf/ShopSection.tsx:176`
- **Problem**: `setProjectDetailOpen(true)` instead of navigating to `/project-kits/[slug]`.
- **Solution**: `window.location.href = '/project-kits/${kit.slug}'`

### M13 ⏳ — Login "Forgot Password" Links to #
- **File**: `src/app/login/page.tsx:187`
- **Problem**: `<a href="#">` does nothing.
- **Solution**: Show toast "Contact support for password reset" or implement reset flow.

### M14 ⏳ — CartDrawer Hardcoded Delivery ৳60
- **File**: `src/components/epf/CartDrawer.tsx:15`
- **Problem**: `const delivery = subtotal > 0 ? 60 : 0;` — doesn't fetch from settings API.
- **Solution**: Fetch shipping rates from `/api/settings` like CheckoutDialog does.

### M15 ⏳ — Admin Pagination Missing (Products, Orders, Users)
- **Files**: `src/app/admin/products/page.tsx`, `orders/page.tsx`, `users/page.tsx`
- **Problem**: API supports pagination but pages don't send page/limit params or render controls. Only first 20 shown.
- **Solution**: Add pagination state, pass `?page=X&limit=Y`, render pagination controls.

### M16 ⏳ — Admin Orders Shipping Address Not Shown
- **File**: `src/app/admin/orders/page.tsx:227-237`, `src/app/api/admin/orders/route.ts:65-68`
- **Problem**: Page renders `detail.shippingAddress.name` but API doesn't include shippingAddress relation. Address stored in `notes` JSON.
- **Solution**: Parse `order.notes` as shipping address in frontend, or add proper relation.

### M17 ⏳ — Downloads API Missing Fields
- **File**: `src/app/api/downloads/route.ts:24-32`
- **Problem**: Profile page expects `unlocked`, `hasFile`, `remaining` but API doesn't return them.
- **Solution**: Compute these fields in the API response.

### M18 ⏳ — Reviews GET Returns ALL Without Filter
- **File**: `src/app/api/reviews/route.ts:17-19`
- **Problem**: No productId/serviceId → returns ALL approved reviews.
- **Solution**: Require at least one filter, or add strict limit.

### M19 ⏳ — Product Detail Null CategoryID Wrong Related
- **File**: `src/app/api/products/[id]/route.ts:37`
- **Problem**: If `categoryId: null`, related query returns ALL products with null category.
- **Solution**: `if (!product.categoryId) return jsonResponse({ data: { product, related: [] } })`

### M20 ⏳ — 500 Errors Leak err.message to Client
- **Files**: Multiple API routes
- **Problem**: `errorResponse(err?.message, 500)` leaks internal details.
- **Solution**: Always return generic "Internal server error" for 500s. Log real error server-side only.

### M21 ⏳ — Service Booking Date Not Validated
- **File**: `src/lib/api-handler.ts:261`
- **Problem**: `bookingDate: z.string().min(1)` accepts past dates or invalid strings.
- **Solution**: Add `.refine(d => !isNaN(Date.parse(d)) && new Date(d) >= new Date(new Date().toDateString()))`

### M22 ⏳ — Coupon Validate orderTotal Can Be NaN
- **File**: `src/app/api/coupons/validate/route.ts:14`
- **Problem**: `parseFloat('abc')` → NaN flows into calculations.
- **Solution**: `if (isNaN(orderTotal)) return errorResponse('Invalid orderTotal', 400)`

### M23 ⏳ — Order Number Race Condition
- **File**: `src/app/api/orders/route.ts:181-184`
- **Problem**: Concurrent orders can get same order number.
- **Solution**: Add unique constraint or use UUID-based order numbers.

### M24 ⏳ — Service Booking Customer Name Lost
- **Files**: `src/components/epf/ServiceBookingDialog.tsx:114-121`, `src/lib/api-handler.ts:259-266`
- **Problem**: Form collects `customerName` but schema doesn't include it. Not sent to API.
- **Solution**: Add `customerName` to booking schema and form submission data.

---

## 🟢 LOW (11 bugs)

### L1 ⏳ — Header Search Services Don't Link to Detail
- **File**: `src/components/epf/Header.tsx:271`
- **Solution**: `window.location.href = '/services/${s.slug}'`

### L2 ⏳ — Header Search Projects Don't Link to Detail
- **File**: `src/components/epf/Header.tsx:287`
- **Solution**: `window.location.href = '/projects/${p.slug}'`

### L3 ⏳ — /placeholder.png Doesn't Exist
- **File**: `src/app/wishlist/page.tsx:63, 107, 117`
- **Solution**: Create `/public/placeholder.png` or use CSS placeholder.

### L4 ⏳ — FlashDeals Hardcoded External Image
- **File**: `src/components/epf/FlashDeals.tsx:161`
- **Solution**: Fetch from banner API or use local asset.

### L5 ⏳ — Test Payment Tokens Lost in Serverless
- **File**: `src/lib/test-payment.ts:6`
- **Solution**: Accept limitation for dev mode only, or use DB store.

### L6 ⏳ — auth-utils.ts Unused Weaker requireAuth
- **File**: `src/lib/auth-utils.ts`
- **Solution**: Remove file if unused.

### L7 ⏳ — AI Agent Swallows Errors
- **File**: `src/app/api/ai/agent/route.ts:59-67`
- **Solution**: Return 502 or add `fallback: true` flag.

### L8 ⏳ — Guest Orders Can't Pay Online
- **Files**: `src/app/api/orders/route.ts:62`, `src/app/api/payments/initiate/route.ts`
- **Solution**: Require auth for online payment, or handle gracefully.

### L9 ⏳ — Settings Color Inputs Allow Incomplete Hex
- **File**: `src/app/admin/settings/page.tsx:109-112`
- **Solution**: Validate exactly 6 hex chars.

### L10 ⏳ — Coupons Page Validity Ignores validFrom
- **File**: `src/app/admin/coupons/page.tsx:93-94`
- **Solution**: Check both `validFrom` and `validTo`.

### L11 ⏳ — Flash Sales Discount NaN on Empty
- **File**: `src/app/admin/flash-sales/page.tsx:35,71`
- **Solution**: Validate discount is valid positive number before save.

---

## ✅ Already Fixed (6 bugs)

| Bug | File | What Changed |
|-----|------|-------------|
| C2 | `src/app/shop/page.tsx` | Fixed ProductsResponse type & pagination access path |
| C3 | `src/app/profile/page.tsx` | Fixed orders/returns query types & access path |
| C9 | `src/app/api/admin/settings/route.ts` | Removed mapSettings() from admin GET, return raw DB fields |
| C10 | `src/app/api/admin/upload/route.ts` + new `[filename]/route.ts` | Added GET (list files) and DELETE (remove file) handlers |
| C11 | `src/app/api/products/route.ts`, `services/route.ts`, `project-kits/route.ts`, `blog/route.ts` | Skip cache when extra filter params present |
| C12 | `src/app/product/[id]/page.tsx` | Removed non-functional "Product Queries (0)" tab |