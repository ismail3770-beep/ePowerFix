# ePowerFix Project Audit and Completion Roadmap

**Audit date:** 15 July 2026  
**Audit mode:** Initial repository audit was read-only. A follow-up stabilization pass later fixed Web build/type blockers; the route findings below were subsequently verified against the active tree.

## Executive summary

The repository is a substantial monorepo with a Next.js web storefront/admin app, an Express API, an Expo mobile app, four shared packages, and a broad Prisma/PostgreSQL domain model. The backend and admin foundation cover products, services, orders, payments, coupons, reviews, projects, project kits, returns, shipments, notifications, content, and AI providers.

The project is not production-ready yet. The main gaps are the incomplete customer-facing storefront, disconnected mobile authentication/cart flows, a placeholder server cart, failing web/API type and lint checks, and several hard-coded admin/mobile UI behaviors.

## Repository structure

- `apps/web`: Next.js storefront and admin dashboard.
- `apps/api`: Express API server.
- `apps/mobile`: Expo Router React Native application.
- `packages/api-client`: shared fetch client and partial domain endpoints.
- `packages/store`: shared Zustand store; cart implementation is still a placeholder.
- `packages/types`: shared TypeScript types; only a small subset is defined.
- `packages/utils`: shared formatting and utility functions.
- `prisma/schema.prisma`: PostgreSQL schema for the commerce and service domains.

## Implemented areas

### Backend/API

- Login, registration, logout, profile update, and password change.
- Cookie-based web authentication and Bearer-token authentication support for mobile.
- Product, category, brand, search, compare, service, project, project-kit, blog, review, wishlist, coupon, address, notification, return, download, and settings routes.
- Guest order creation and authenticated order listing.
- Order tracking and return request handling.
- bKash, Nagad, and SSLCommerz initiation/callback foundations.
- Protected admin route group with broad CRUD coverage.
- Prisma models for users, products, variants, carts, orders, payments, shipping, services, bookings, reviews, content, projects, kits, coupons, taxes, settings, and related entities.

### Web

- Reusable public-facing sections are already implemented in `apps/web/src/components/epf`, including `HeroBanner`, `ShopSection`, `ServicesSection`, `ProjectsSection`, `CategoryGrid`, `TrustBar`, and related product/project-card components.
- Active detail routes exist for `/product/[id]`, `/shop/[id]`, `/services/[slug]`, and `/projects/[slug]`.
- Login/register, checkout, order tracking, profile, wishlist, services, projects, project detail, and multiple admin screens are substantially developed.
- Checkout supports COD and online payment initiation.
- The public UI components should not be rebuilt from scratch; the next task is to connect them to active listing/page route entry files.

### Mobile

- Home, product browsing/search, product detail, services, cart tab, and login screens.
- Product listing is partially connected to the API.
- Mobile TypeScript validation currently passes.

## Critical gaps

### Public page route integration

The user correctly noted that the public page UI/sections have already been created. Verification shows the reusable implementations exist, but the active Next.js App Router currently lacks these public listing/entry files:

- `apps/web/src/app/page.tsx` — home route entry
- `apps/web/src/app/shop/page.tsx` — shop listing route
- `apps/web/src/app/services/page.tsx` — services listing route
- `apps/web/src/app/projects/page.tsx` — projects listing route
- `apps/web/src/app/project-kits/page.tsx` — project-kits listing route
- A public blog route under `apps/web/src/app`; blog currently exists under admin/API only

The detail routes and reusable sections are real existing work. The next storefront task should integrate those components into the missing public route entries rather than recreate the page designs.

### Web build and type blockers

The initial production build failed at `apps/web/src/app/get-quote/page.tsx` because `useState` was imported twice. That blocker and the initial Web TypeScript errors were fixed in the follow-up stabilization pass. The current Web build and TypeScript check pass.

### API type safety

The API TypeScript check reports 157 errors. The dominant issue is that Express route params are treated as `string | string[]` when passed directly into Prisma queries. There are also relation/type mismatches, including product review handling.

### Cart

`apps/api/src/routes/cart.ts` is explicitly a future server-side sync placeholder and always returns an empty list. `packages/store/src/cart.ts` is also marked as a placeholder. The web has a local cart flow, but the mobile cart is hard-coded empty and mobile Add to Cart actions do not mutate shared state.

### Mobile authentication and commerce

- Login does not persist the returned token.
- SecureStore/AsyncStorage is not used for the authenticated session.
- Later mobile requests do not send a Bearer token.
- Register and password recovery actions are not implemented.
- Product detail uses a package emoji instead of the product image.
- Mobile Add to Cart only navigates to the cart in some paths; it does not add an item.
- Wishlist, Buy Now, service booking, profile actions, order history, and mobile checkout are incomplete or visual-only.

### Admin dashboard data

The admin dashboard includes hard-coded sample sales data, approximate order-status percentages, and synthetic top-product sold counts. These values should be replaced with real analytics API data.

### Seed/content

The seed setup intentionally creates no products, services, projects, orders, or customers. A fresh environment therefore appears empty until content is entered manually through admin.

### Security and configuration risks

- Payment callback IP filtering allows all IPs when `PAYMENT_CALLBACK_IP_WHITELIST` is unset. This may be acceptable for local development but must be configured and enforced in production.
- Guest orders can be created, while online payment initiation requires an authenticated user. The checkout product decision for guest online payments must be explicit.
- Root configuration declares pnpm, but pnpm is unavailable in the environment and the repository contains `bun.lock`; package-manager usage should be standardized.

## Validation performed

### Initial audit checks

The initial read-only audit found:

| Check | Initial result |
|---|---|
| Root `pnpm run lint` | Could not run because pnpm is not installed; Turbo also could not resolve the configured package-manager binary. |
| Direct Web ESLint | Failed: 362 errors and 77 warnings. |
| Web TypeScript | Failed: 25 errors. |
| API TypeScript | Failed: 157 errors. |
| Mobile TypeScript | Passed. |
| Web production build | Failed on duplicate `useState` import in `get-quote/page.tsx`. |
| API build | Exited successfully, but the script is only a no-op echo. |
| Targeted API-handler tests | Passed: 24/24. |
| Full test script | No root test script is configured. |

### Follow-up Web stabilization

After the audit, the first Priority 1 Web stabilization batch fixed the initial Web compile blockers and verified:

| Check | Follow-up result |
|---|---|
| Web production build | Passed; 47 static/dynamic routes generated. |
| Web TypeScript | Passed with no errors. |
| Targeted API-handler tests | Passed: 24/24. |
| `git diff --check` | Passed. |

The successful route list confirms the existing detail routes and also confirms that the public listing entries described above are still absent. API TypeScript errors and the broad lint backlog remain separate follow-up work.

The workspace already contained many modified, deleted, and untracked files before implementation resumed. Those changes must be preserved and reviewed before any cleanup or reset operation.

## Prioritized completion roadmap

### Priority 0: Protect existing work and standardize the environment

1. Preserve the current dirty-worktree changes; do not reset or clean them.
2. Choose pnpm or Bun as the single package manager and align scripts/lockfiles.
3. Verify `.env`, database connectivity, payment credentials, and deployment configuration.
4. Add useful demo/seed content for local development.

### Priority 1: Make the project buildable and type-safe

1. Fix the duplicate import and other immediate Web build blockers.
2. Fix Web TypeScript errors and React type-version mismatches.
3. Normalize Express route params before Prisma queries.
4. Resolve API relation/type errors and add a real API type-check/build step.
5. Replace placeholder lint scripts with meaningful checks.

### Priority 2: Complete the Web storefront

Implement the customer-facing route integration using the existing public components:

`Home -> Shop -> Product detail -> Cart -> Checkout -> Payment -> Order tracking`

This includes adding the missing route entry files, wiring existing `HeroBanner`, `ShopSection`, `ServicesSection`, `ProjectsSection`, and project-kit sections to their listing routes, then completing filtering, sorting, pagination, image gallery, variants, real cart behavior, and loading/error/empty states.

### Priority 3: Make commerce reliable

1. Implement one shared persisted cart model for Web and mobile.
2. Merge duplicate product/variant items correctly.
3. Validate stock and decrement stock transactionally when orders are placed.
4. Make coupon usage concurrency-safe.
5. Define and implement the guest COD/online-payment policy.
6. Verify payment callbacks, order status transitions, and tracking end-to-end.

### Priority 4: Complete the mobile app

1. Use the shared API client.
2. Persist mobile auth tokens securely and attach them to requests.
3. Implement registration, password recovery, profile, order history, and logout.
4. Connect cart, wishlist, product images, variants, Buy Now, checkout, payment, and service booking.
5. Replace visual-only navigation actions with real destinations.

### Priority 5: Complete admin/data operations

1. Replace hard-coded dashboard metrics with real analytics.
2. Verify product/media upload and content management.
3. Add meaningful seed data.
4. Review admin authorization and sensitive payment-gateway settings.

### Priority 6: Test, secure, and deploy

1. Add API authorization and commerce integration tests.
2. Add Web checkout/order E2E coverage.
3. Add mobile critical-flow validation.
4. Enforce payment callback security in production.
5. Run deployment smoke tests, monitoring, and error-reporting checks.

## Immediate implementation sequence

The recommended implementation order is:

1. Fix the Web build blocker and Web TypeScript blockers.
2. Add the missing public route entries and integrate the existing home/shop/service/project/project-kit UI components.
3. Complete the Web cart and checkout journey.
4. Connect mobile auth and cart.
5. Harden stock/order/payment behavior.
6. Replace admin mock analytics and add seed data.
7. Finish automated tests and deployment validation.
