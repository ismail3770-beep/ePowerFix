# 🔍 Existing Structure Analysis — App Build Compatibility

> **Question:** Can we build the app with the current website structure, or do we need to change it?
> **Short Answer:** YES, app can be built with current structure — but with **smart refactoring** to maximize code reuse.

---

## 📊 Current Structure Overview

```
ePowerFix/
├── src/
│   ├── app/                      ← Next.js pages + API routes (MIXED)
│   │   ├── (storefront pages)/   ← UI pages (React components)
│   │   ├── admin/                ← Admin UI pages
│   │   └── api/                  ← Backend API routes (server-side)
│   ├── components/
│   │   ├── ui/                   ← shadcn/ui components (WEB-ONLY)
│   │   └── epf/                  ← ePowerFix custom components (WEB-ONLY)
│   ├── lib/                      ← Utilities + API client (SHARABLE!)
│   │   ├── api.ts                ← API client (fetch-based)
│   │   ├── admin-api.ts          ← Admin API client
│   │   ├── utils.ts              ← Helper functions
│   │   ├── payments.ts           ← Payment logic
│   │   ├── auth.ts               ← Auth helpers
│   │   └── ...
│   ├── store/                    ← Zustand state (SHARABLE!)
│   │   ├── cart-store.ts         ← Cart state
│   │   ├── auth-store.ts         ← Auth state
│   │   └── ...
│   ├── hooks/                    ← React hooks
│   ├── icons/                    ← SVG icons (SHARABLE with adaptation)
│   └── auth.ts                   ← NextAuth config
├── prisma/                       ← Database (SHARED via API)
│   └── schema.prisma
└── package.json
```

---

## ✅ What Can Be Reused DIRECTLY (No Change)

These work in BOTH web and mobile without modification:

| Component | Location | Reuse % | Why |
|-----------|----------|---------|-----|
| **API routes** (`/api/*`) | `src/app/api/` | 100% | Server-side, mobile calls via HTTP |
| **Prisma schema** | `prisma/schema.prisma` | 100% | Same database |
| **Auth logic** (backend) | `src/auth.ts`, `/api/auth/*` | 100% | JWT/session works for mobile too |
| **Payment webhooks** | `/api/payments/*` | 100% | Server-side |
| **Business logic** | `src/lib/payments.ts` (parts) | 90% | Pure TS functions |
| **Type definitions** | (need extraction) | 100% | TypeScript types |
| **Validation schemas** | (zod schemas) | 100% | Pure TS |

### Backend = 100% Reusable ✅

Your entire backend (API routes + database + auth + payments) works as-is. The mobile app will simply call the same API endpoints:

```
Mobile App  →  https://epowerfix.com.bd/api/products
Web App     →  /api/products  (same handler)

Both hit the same Next.js API route → same database → same logic
```

**No backend changes needed.** Just deploy the Next.js app to a public URL and the mobile app calls that URL.

---

## 🔄 What Needs REFACTORING (Small Changes)

### 1. Extract Shared Code to Packages (MEDIUM effort)

Currently shared logic is mixed with web-specific code. Need to split into a monorepo:

**BEFORE (current):**
```
src/lib/api.ts          ← uses fetch (works in RN too, but URL is relative)
src/store/cart-store.ts ← uses zustand persist (localStorage — RN needs AsyncStorage)
```

**AFTER (refactored):**
```
packages/
├── api/
│   └── src/
│       ├── client.ts      ← apiFetch (configurable base URL)
│       ├── products.ts    ← product endpoints
│       ├── orders.ts      ← order endpoints
│       └── auth.ts        ← auth endpoints
├── types/
│   └── src/
│       ├── product.ts     ← Product, Category, Brand types
│       ├── order.ts       ← Order, CartItem types
│       ├── user.ts        ← User, Auth types
│       └── index.ts
├── store/
│   └── src/
│       ├── cart.ts        ← Cart store (storage-agnostic)
│       └── auth.ts        ← Auth store
└── utils/
    └── src/
        ├── format.ts      ← price formatting, dates
        ├── validation.ts  ← zod schemas
        └── constants.ts   ← API URL, config
```

### 2. Fix API Client for Mobile (SMALL change)

**Current problem:** `src/lib/api.ts` uses relative URLs (`/api/products`):

```typescript
// CURRENT — works for web (same-origin), breaks for mobile
const url = endpoint  // e.g., "/api/products"
const res = await fetch(url, { credentials: 'include' })
```

**Fix — make base URL configurable:**

```typescript
// packages/api/src/client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
// Web: '' (empty, uses same-origin)
// Mobile: 'https://epowerfix.com.bd'

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // web: cookies; mobile: add Authorization header
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}
```

**For mobile auth:** Since mobile can't use httpOnly cookies easily, add token-based auth:

```typescript
// Mobile version
export async function apiFetchMobile<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await SecureStore.getItemAsync('auth_token')
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  // ...
}
```

**Backend change needed:** Add a `/api/auth/mobile-login` endpoint that returns a JWT token (in addition to the cookie-based auth for web). Small addition, ~50 lines.

### 3. Fix Zustand Stores for Mobile (SMALL change)

**Current problem:** `cart-store.ts` uses `persist` middleware with localStorage (default). React Native doesn't have localStorage.

**Fix — use storage adapter pattern:**

```typescript
// packages/store/src/cart.ts
import { create, StateCreator } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Web storage (localStorage)
const webStorage = createJSONStorage(() => localStorage)

// Mobile storage (AsyncStorage) — injected from app
let mobileStorage: any = null
export function setMobileStorage(storage: any) {
  mobileStorage = createJSONStorage(() => storage)
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({ /* ... */ }),
    {
      name: 'cart-storage',
      storage: mobileStorage || webStorage, // auto-detect
    }
  )
)
```

Then in mobile app:
```typescript
// apps/mobile/app/_layout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setMobileStorage } from '@epowerfix/store'

setMobileStorage(AsyncStorage)
```

---

## ❌ What CANNOT Be Reused (Must Rewrite for Mobile)

### 1. UI Components (100% rewrite)

| Component | Web (current) | Mobile (new) |
|-----------|---------------|--------------|
| `<Button>` | shadcn/ui (HTML `<button>`) | React Native `<Pressable>` |
| `<Input>` | shadcn/ui (HTML `<input>`) | `<TextInput>` |
| `<Card>` | `<div>` + Tailwind | `<View>` + StyleSheet |
| `<Dialog>` | Radix UI (HTML portal) | `@gorhom/bottom-sheet` or `<Modal>` |
| `<Select>` | Radix UI | `<FlatList>` picker or `react-native-picker` |
| `<Tabs>` | Radix UI | Custom tabs with `<View>` |
| Images | `next/image` | `expo-image` |
| Icons | Custom SVG components | `@expo/vector-icons` |

**Good news:** You can use **NativeWind** to write Tailwind classes for React Native. This means your team's Tailwind knowledge transfers directly.

### 2. Pages → Screens (rewrite, but logic shared)

| Web Page | Mobile Screen | Shared Logic |
|----------|---------------|--------------|
| `app/page.tsx` (Home) | `app/(tabs)/index.tsx` | API calls, data types |
| `app/shop/[id]/page.tsx` | `app/product/[id].tsx` | Product type, cart logic |
| `app/checkout/page.tsx` | `app/checkout.tsx` | Order creation API |
| `app/login/page.tsx` | `app/login.tsx` | Auth API, validation |
| `app/order-track/page.tsx` | `app/order-track.tsx` | Order tracking API |

Each screen is rewritten in React Native, but **calls the same API** and uses **the same TypeScript types**.

### 3. Routing

| Web | Mobile |
|-----|--------|
| Next.js App Router (file-based) | Expo Router (file-based, similar!) |
| `<Link href="/shop">` | `<Link href="/shop">` (same syntax!) |

**Good news:** Expo Router uses the same file-based routing concept as Next.js. Learning curve is minimal.

### 4. Styling

| Web | Mobile |
|-----|--------|
| Tailwind CSS 4 | NativeWind (Tailwind for RN) |
| `className="p-4 bg-white"` | `className="p-4 bg-white"` (SAME!) |

**With NativeWind, you write the same Tailwind classes.** Massive productivity boost.

---

## 🏗️ Recommended Structure: Turborepo Monorepo

```
ePowerFix/
├── apps/
│   ├── web/                       ← Your current Next.js (moved here)
│   │   ├── src/
│   │   │   ├── app/               ← Pages + API routes
│   │   │   ├── components/        ← Web-only UI (shadcn/ui, epf/)
│   │   │   └── ...
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   └── mobile/                    ← NEW: Expo React Native app
│       ├── app/                   ← Screens (Expo Router)
│       │   ├── _layout.tsx
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx
│       │   │   ├── index.tsx      ← Home
│       │   │   ├── shop.tsx
│       │   │   ├── services.tsx
│       │   │   ├── cart.tsx
│       │   │   └── profile.tsx
│       │   ├── product/[id].tsx
│       │   ├── checkout.tsx
│       │   ├── login.tsx
│       │   └── ...
│       ├── components/            ← Mobile-only UI
│       ├── assets/                ← Icons, images
│       ├── app.config.ts
│       └── package.json
│
├── packages/
│   ├── api/                       ← SHARED: API client
│   │   └── src/
│   │       ├── client.ts          ← apiFetch (configurable)
│   │       ├── products.ts
│   │       ├── orders.ts
│   │       ├── auth.ts
│   │       └── index.ts
│   │
│   ├── types/                     ← SHARED: TypeScript types
│   │   └── src/
│   │       ├── product.ts
│   │       ├── order.ts
│   │       ├── user.ts
│   │       └── index.ts
│   │
│   ├── store/                     ← SHARED: Zustand stores
│   │   └── src/
│   │       ├── cart.ts
│   │       ├── auth.ts
│   │       └── index.ts
│   │
│   ├── utils/                     ← SHARED: Utilities
│   │   └── src/
│   │       ├── format.ts          ← Price, date formatting
│   │       ├── validation.ts      ← Zod schemas
│   │       ├── constants.ts       ← Config, URLs
│   │       └── index.ts
│   │
│   └── ui/                        ← SHARED: Cross-platform UI (optional)
│       └── src/
│           ├── Button.tsx         ← NativeWind based
│           ├── Card.tsx
│           └── ...
│
├── prisma/                        ← Database schema (shared)
│   └── schema.prisma
│
├── turbo.json                     ← Turborepo config
├── package.json                   ← Root workspace
└── bun.lock
```

---

## 📋 Migration Plan: Current → Monorepo

### Step 1: Set Up Turborepo (1 day)

```bash
cd /home/z/ePowerFix
bun add -d turbo
```

Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {}
  }
}
```

Update root `package.json`:
```json
{
  "name": "epowerfix-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint"
  }
}
```

### Step 2: Move Next.js to `apps/web/` (1 day)

```bash
mkdir -p apps/web
# Move all current files except prisma/ and docs/ to apps/web/
mv src apps/web/src
mv public apps/web/public
mv next.config.ts apps/web/
mv package.json apps/web/  (rename to web's package.json)
# Keep prisma/ at root (shared)
# Keep docs/ at root
```

### Step 3: Create Shared Packages (3-5 days)

Create each package:
- `packages/api/` — extract `src/lib/api.ts`, `src/lib/admin-api.ts`
- `packages/types/` — extract types from various files
- `packages/store/` — extract `src/store/*`
- `packages/utils/` — extract `src/lib/utils.ts`, `src/lib/payments.ts` (pure logic parts)

Each package has its own `package.json`:
```json
{
  "name": "@epowerfix/api",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

### Step 4: Update Web App Imports (1 day)

Change imports in `apps/web/`:
```typescript
// BEFORE
import { api } from '@/lib/api'
import { useCartStore } from '@/store/cart-store'

// AFTER
import { api } from '@epowerfix/api'
import { useCartStore } from '@epowerfix/store'
```

Verify web still works after refactor.

### Step 5: Create Expo App (1 day)

```bash
cd apps
bunx create-expo-app mobile --template tabs
cd mobile
```

### Step 6: Wire Shared Packages (1 day)

In `apps/mobile/package.json`:
```json
{
  "dependencies": {
    "@epowerfix/api": "workspace:*",
    "@epowerfix/types": "workspace:*",
    "@epowerfix/store": "workspace:*",
    "@epowerfix/utils": "workspace:*"
  }
}
```

### Step 7: Build Mobile Screens (3-5 weeks)

Build all screens using shared API + types + stores.

### Step 8: Test & Submit (1 week)

Test on devices, then submit to stores.

**Total migration time: 5-8 weeks** (most of which is building mobile screens, not refactoring)

---

## 🎯 Summary Table

| Component | Reuse? | Effort | Notes |
|-----------|--------|--------|-------|
| **Backend API routes** | ✅ 100% | 0 | Same endpoints, mobile calls via HTTP |
| **Prisma schema** | ✅ 100% | 0 | Same database |
| **Auth (backend)** | ✅ 95% | Small | Add JWT endpoint for mobile |
| **Payment webhooks** | ✅ 100% | 0 | Server-side |
| **API client** | 🔄 90% | Small | Make base URL configurable |
| **TypeScript types** | ✅ 100% (after extract) | Medium | Move to `packages/types` |
| **Zustand stores** | 🔄 85% | Small | Use storage adapter |
| **Business logic** (pricing, cart calc) | ✅ 100% (after extract) | Small | Move to `packages/utils` |
| **UI components** (shadcn/ui) | ❌ 0% | Rewrite | Use NativeWind + RN components |
| **Pages** | ❌ 20% (logic shared) | Rewrite | Same API, new UI |
| **Styling** | 🔄 70% | Medium | NativeWind = same Tailwind classes |
| **Icons** | 🔄 60% | Small | Use `@expo/vector-icons` |
| **Routing** | 🔄 70% | Small | Expo Router ≈ Next.js App Router |

### Overall Reuse Estimate

```
Backend:        ████████████████████ 100%  (no change)
Business logic: ███████████████████░  90%  (small refactor)
Types/Utils:    ████████████████████ 100%  (just move to packages)
State:          █████████████████░░░  85%  (storage adapter)
UI:             ░░░░░░░░░░░░░░░░░░░░   0%  (rewrite with NativeWind)
Pages→Screens:  ████░░░░░░░░░░░░░░░░  20%  (logic shared, UI rewrite)

TOTAL code reuse: ~60-70%
```

---

## ✅ Final Answer

### Can we build the app with current structure?

**YES — with smart refactoring.**

1. **Backend = 100% reusable** (no changes to API, database, auth, payments)
2. **Business logic = 90% reusable** (extract to shared packages)
3. **UI = must rewrite** (but use NativeWind to keep Tailwind classes)
4. **Structure = needs monorepo setup** (Turborepo to organize shared code)

### Do we need to change the structure?

**Partially yes:**

| Change | Required? | Effort |
|--------|-----------|--------|
| Move to monorepo (apps/web, apps/mobile, packages/*) | ✅ Yes | 1 week |
| Extract shared code to packages | ✅ Yes | 3-5 days |
| Make API client URL-configurable | ✅ Yes | 1 hour |
| Add JWT auth endpoint for mobile | ✅ Yes | 1 day |
| Rewrite UI components for mobile | ✅ Yes (unavoidable) | 2-3 weeks |
| Change backend API routes | ❌ No | 0 |
| Change database schema | ❌ No | 0 |
| Change payment logic | ❌ No | 0 |

### Recommendation

**Phase 1 (NOW):** Don't restructure yet. Set up PWA first (1 week, zero restructuring). Get users.

**Phase 2 (Month 4+):** When ready for native app:
1. Set up Turborepo monorepo (1 week)
2. Extract shared code (3-5 days)
3. Verify web still works (1 day)
4. Build mobile app using shared code (3-5 weeks)

**The backend NEVER needs to change.** Only the code organization (monorepo) and the mobile UI (new screens) are needed.

---

## 📋 Agent Task Checklist

### Pre-Migration (do these FIRST, before any restructuring)

| Task ID | Task |
|---------|------|
| STR-1 | Set up PWA on current structure (no restructuring needed) |
| STR-2 | Test website runs cleanly |
| STR-3 | Document all API endpoints (for mobile to consume) |
| STR-4 | Add CORS headers to API routes (for mobile requests) |

### Migration (when ready for native app)

| Task ID | Task |
|---------|------|
| MIG-1 | Install Turborepo |
| MIG-2 | Create monorepo structure (apps/, packages/) |
| MIG-3 | Move Next.js to apps/web/ |
| MIG-4 | Create packages/api/ and extract api.ts |
| MIG-5 | Create packages/types/ and extract types |
| MIG-6 | Create packages/store/ and extract stores |
| MIG-7 | Create packages/utils/ and extract utils |
| MIG-8 | Update web app imports to use @epowerfix/* |
| MIG-9 | Verify web app still works after migration |
| MIG-10 | Add JWT-based auth endpoint for mobile |
| MIG-11 | Add CORS configuration to API routes |
| MIG-12 | Make API client base URL configurable |

### Mobile App Build

| Task ID | Task |
|---------|------|
| MOB-1 | Create Expo app in apps/mobile/ |
| MIG-2 | Install NativeWind for Tailwind styling |
| MOB-3 | Wire @epowerfix/* packages |
| MOB-4 | Configure app.config.ts |
| MOB-5 | Build auth screens (login, register) |
| MOB-6 | Build tab navigation |
| MOB-7 | Build home screen |
| MOB-8 | Build shop screen |
| MOB-9 | Build product detail screen |
| MOB-10 | Build cart screen |
| MOB-11 | Build checkout screen |
| MOB-12 | Build order tracking screen |
| MOB-13 | Build service screens |
| MOB-14 | Build project kit screens |
| MOB-15 | Build profile screen |
| MOB-16 | Integrate payments (WebView) |
| MOB-17 | Configure push notifications |
| MOB-18 | Test on Android |
| MOB-19 | Test on iOS |
| MOB-20 | Submit to Play Store |
| MOB-21 | Submit to App Store |

---

*End of document. See also: [LAUNCH_ROADMAP.md](./LAUNCH_ROADMAP.md), [APP_BUILD_GUIDE.md](./APP_BUILD_GUIDE.md)*
