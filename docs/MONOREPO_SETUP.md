# 🏗️ ePowerFix Monorepo Setup Guide

> **Question:** For building app alongside website, do we need a mono (monorepo) structure?
> **Answer:** YES — Monorepo is the professional, scalable way. This guide explains why and how.

---

## 🤔 What is a Monorepo?

### Single Repo (NOT Monorepo) — Current State

```
ePowerFix/                    ← One repo, only web
├── src/                      ← Next.js code only
├── prisma/
└── package.json
```

**Problem:** If you build a mobile app separately, you'd need:

```
ePowerFix-web/                ← Repo 1 (website)
└── src/

ePowerFix-mobile/             ← Repo 2 (mobile app) — DUPLICATE CODE!
└── app/

ePowerFix-shared/             ← Repo 3 (shared types/api) — sync nightmare!
└── src/
```

❌ Three repos → three deployments → code duplication → version mismatch nightmare.

### Monorepo — Recommended

```
ePowerFix/                    ← ONE repo, multiple apps
├── apps/
│   ├── web/                  ← Next.js website
│   ├── mobile/               ← Expo mobile app (new)
│   └── admin/                ← (future) separate admin app
├── packages/
│   ├── api/                  ← SHARED: API client
│   ├── types/                ← SHARED: TypeScript types
│   ├── store/                ← SHARED: Zustand stores
│   ├── utils/                ← SHARED: Utilities
│   └── ui/                   ← SHARED: Cross-platform components
├── prisma/                   ← SHARED: Database schema
├── docs/
├── turbo.json                ← Turborepo config
└── package.json              ← Root workspace config
```

✅ One repo → one source of truth → shared code → atomic updates across web + mobile.

---

## 🎯 Why Monorepo? (Benefits)

| Benefit | Explanation |
|---------|-------------|
| **Code sharing** | API client, types, utils written ONCE → used by web + mobile |
| **Atomic commits** | Change a type → web + mobile updated in same commit |
| **Single source of truth** | No version drift between repos |
| **Easier refactoring** | Rename a function → updates everywhere instantly |
| **Shared tooling** | One ESLint config, one TS config, one CI pipeline |
| **Simpler CI/CD** | Build both apps from one pipeline |
| **Easier debugging** | Search across all code in one place |
| **Team collaboration** | Everyone sees the full picture |

---

## 🆚 Monorepo vs Polyrepo — Comparison

| Aspect | Polyrepo (separate repos) | Monorepo (single repo) |
|--------|--------------------------|------------------------|
| Code duplication | ❌ High | ✅ None |
| Version sync | ❌ Manual, error-prone | ✅ Automatic |
| Setup effort | ✅ Low (just create repos) | 🔄 Medium (one-time) |
| Scaling | ❌ Gets messy fast | ✅ Scales well |
| CI/CD | ❌ Per-repo pipelines | ✅ Unified pipeline |
| Industry standard | ❌ Old approach | ✅ Modern (Google, Meta, Microsoft use it) |

**Famous companies using monorepos:** Google, Meta (Facebook), Microsoft, Twitter, Uber, Airbnb, Vercel, Shopify.

---

## 🛠️ Monorepo Tools: Turborepo vs Nx vs Lerna

| Tool | Recommendation | Why |
|------|---------------|-----|
| **Turborepo** | ✅ BEST for ePowerFix | Simple, fast, Vercel-backed, great Next.js + Expo support |
| **Nx** | ⚠️ Overkill | More features but steeper learning curve |
| **Lerna** | ❌ Deprecated | Mostly abandoned, use Turborepo instead |

**We'll use Turborepo** — it's the modern standard for Next.js + Expo monorepos.

---

## 📦 Complete Monorepo Structure for ePowerFix

```
ePowerFix/
│
├── apps/                              ← APPLICATIONS (runnable)
│   │
│   ├── web/                           ← Next.js website (existing, moved)
│   │   ├── src/
│   │   │   ├── app/                   ← Pages + API routes
│   │   │   │   ├── (storefront)/
│   │   │   │   ├── admin/
│   │   │   │   └── api/               ← Backend API (shared with mobile)
│   │   │   ├── components/            ← Web-only UI (shadcn/ui, epf/)
│   │   │   │   ├── ui/
│   │   │   │   └── epf/
│   │   │   ├── hooks/
│   │   │   ├── icons/
│   │   │   └── auth.ts                ← NextAuth config
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── mobile/                        ← Expo React Native app (NEW)
│       ├── app/                       ← Screens (Expo Router)
│       │   ├── _layout.tsx            ← Root layout
│       │   ├── (tabs)/                ← Bottom tab navigation
│       │   │   ├── _layout.tsx
│       │   │   ├── index.tsx          ← Home
│       │   │   ├── shop.tsx           ← Shop
│       │   │   ├── services.tsx       ← Services
│       │   │   ├── cart.tsx           ← Cart
│       │   │   └── profile.tsx        ← Profile
│       │   ├── product/[id].tsx       ← Product detail
│       │   ├── checkout.tsx
│       │   ├── order-track.tsx
│       │   ├── login.tsx
│       │   ├── register.tsx
│       │   └── search.tsx
│       ├── components/                ← Mobile-only UI components
│       ├── assets/                    ← Icons, images, fonts
│       ├── app.config.ts              ← Expo config
│       ├── babel.config.js
│       ├── tsconfig.json
│       └── package.json
│
├── packages/                          ← SHARED LIBRARIES
│   │
│   ├── api/                           ← API client (shared)
│   │   ├── src/
│   │   │   ├── client.ts              ← fetch wrapper (configurable URL)
│   │   │   ├── products.ts            ← product endpoints
│   │   │   ├── orders.ts              ← order endpoints
│   │   │   ├── auth.ts                ← auth endpoints
│   │   │   ├── services.ts            ← service endpoints
│   │   │   ├── projects.ts            ← project endpoints
│   │   │   ├── payments.ts            ← payment endpoints
│   │   │   └── index.ts               ← re-exports everything
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── types/                         ← TypeScript types (shared)
│   │   ├── src/
│   │   │   ├── product.ts             ← Product, Category, Brand, Review
│   │   │   ├── order.ts               ← Order, CartItem, OrderStatus
│   │   │   ├── user.ts                ← User, Session, AuthResponse
│   │   │   ├── service.ts             ← Service, Booking
│   │   │   ├── project.ts             ← Project, ProjectKit
│   │   │   ├── payment.ts             ← Payment, PaymentMethod
│   │   │   ├── api.ts                 ← ApiResponse, PaginatedResult
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── store/                         ← Zustand stores (shared)
│   │   ├── src/
│   │   │   ├── cart.ts                ← Cart store (storage adapter)
│   │   │   ├── auth.ts                ← Auth store
│   │   │   ├── wishlist.ts            ← Wishlist store
│   │   │   ├── ui.ts                  ← UI state (theme, etc.)
│   │   │   ├── storage.ts             ← Storage adapter (web vs mobile)
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── utils/                         ← Utility functions (shared)
│   │   ├── src/
│   │   │   ├── format.ts              ← formatPrice, formatDate (BDT, bn-BD)
│   │   │   ├── validation.ts          ← zod schemas
│   │   │   ├── constants.ts           ← API_URL, APP_NAME, etc.
│   │   │   ├── pricing.ts             ← pricing calculations
│   │   │   ├── cart.ts                ← cart calculations
│   │   │   ├── slug.ts                ← slugify
│   │   │   ├── id.ts                  ← generateId
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   │   └── package.json
│   │
│   └── ui/                            ← Cross-platform UI (optional, advanced)
│       ├── src/
│       │   ├── Button.tsx             ← NativeWind-based, works web + mobile
│       │   ├── Card.tsx
│       │   ├── Input.tsx
│       │   ├── Badge.tsx
│       │   ├── ProductCard.tsx
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── prisma/                            ← Database (shared)
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── docs/                              ← Documentation (shared)
│   ├── LAUNCH_ROADMAP.md
│   ├── APP_BUILD_GUIDE.md
│   ├── STRUCTURE_ANALYSIS.md
│   └── MONOREPO_SETUP.md              ← This file
│
├── .github/
│   └── workflows/
│       └── ci.yml                     ← GitHub Actions CI
│
├── turbo.json                         ← Turborepo config
├── package.json                       ← Root workspace
├── bun.lock                           ← Bun lockfile
├── tsconfig.base.json                 ← Shared TS config
├── .eslintrc.js                       ← Shared ESLint
├── .gitignore
└── README.md
```

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Install Turborepo + Create Workspace

```bash
cd /home/z/ePowerFix

# Install Turborepo
bun add -d turbo

# Initialize workspace
# (We'll configure manually for full control)
```

### Step 2: Create Root `package.json`

```json
{
  "name": "epowerfix",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "dev:web": "turbo dev --filter=@epowerfix/web",
    "dev:mobile": "turbo dev --filter=@epowerfix/mobile",
    "build:web": "turbo build --filter=@epowerfix/web",
    "build:mobile": "turbo build --filter=@epowerfix/mobile",
    "db:push": "bun prisma/db push",
    "db:seed": "bun prisma/seed.ts",
    "db:generate": "prisma generate"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Step 3: Create `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### Step 4: Create `tsconfig.base.json` (Shared TS Config)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@epowerfix/api": ["./packages/api/src"],
      "@epowerfix/types": ["./packages/types/src"],
      "@epowerfix/store": ["./packages/store/src"],
      "@epowerfix/utils": ["./packages/utils/src"],
      "@epowerfix/ui": ["./packages/ui/src"]
    }
  }
}
```

### Step 5: Move Next.js to `apps/web/`

```bash
# Create apps directory
mkdir -p apps/web

# Move Next.js files (NOT prisma, docs, turbo.json, root package.json)
mv src apps/web/src
mv public apps/web/public
mv next.config.ts apps/web/
mv tailwind.config.ts apps/web/
mv postcss.config.mjs apps/web/
mv components.json apps/web/
mv eslint.config.mjs apps/web/
mv tsconfig.json apps/web/tsconfig.json
mv .env.example apps/web/
mv _dream_query.js apps/web/

# Keep at root:
# prisma/ (shared)
# docs/ (shared)
# Caddyfile (shared)
# vercel.json (shared or move to apps/web)
```

### Step 6: Create `apps/web/package.json`

```json
{
  "name": "@epowerfix/web",
  "version": "0.2.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "eslint ."
  },
  "dependencies": {
    "@epowerfix/api": "workspace:*",
    "@epowerfix/types": "workspace:*",
    "@epowerfix/store": "workspace:*",
    "@epowerfix/utils": "workspace:*",
    "next": "^16.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^6.11.1",
    "next-auth": "^5.0.0-beta.31",
    "zustand": "^5.0.6",
    "tailwindcss": "^4",
    "@radix-ui/react-dialog": "^1.1.14",
    "lucide-react": "^0.525.0"
    // ... all other existing deps
  }
}
```

### Step 7: Create Shared Packages

#### `packages/api/package.json`

```json
{
  "name": "@epowerfix/api",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint ."
  },
  "dependencies": {
    "@epowerfix/types": "workspace:*",
    "@epowerfix/utils": "workspace:*"
  }
}
```

#### `packages/api/src/client.ts`

```typescript
import type { ApiResponse } from '@epowerfix/types'

// Configurable base URL — web uses '', mobile uses full URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''
// Web:  '' (same-origin, uses Next.js proxy)
// Mobile: 'https://epowerfix.com.bd'

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

// Mobile-specific fetch (uses Bearer token instead of cookies)
export async function apiFetchMobile<T>(
  endpoint: string,
  token: string | null,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: 'DELETE' }),
}
```

#### `packages/api/src/products.ts`

```typescript
import { api } from './client'
import type { Product, PaginatedResponse } from '@epowerfix/types'

export const productsApi = {
  list: (params?: {
    page?: number
    limit?: number
    category?: string
    search?: string
  }) => {
    const query = new URLSearchParams(params as any).toString()
    return api.get<PaginatedResponse<Product>>(`/api/products?${query}`)
  },

  getById: (id: string) =>
    api.get<{ product: Product }>(`/api/products/${id}`),

  compare: (ids: string[]) =>
    api.post<{ products: Product[] }>(`/api/products/compare`, { ids }),
}
```

#### `packages/api/src/orders.ts`

```typescript
import { api } from './client'
import type { Order, CreateOrderInput } from '@epowerfix/types'

export const ordersApi = {
  create: (input: CreateOrderInput) =>
    api.post<{ order: Order; paymentUrl?: string }>(`/api/orders`, input),

  track: (trackingId: string) =>
    api.get<{ order: Order }>(`/api/orders/track?id=${trackingId}`),

  mine: () =>
    api.get<{ orders: Order[] }>(`/api/orders/mine`),
}
```

#### `packages/api/src/index.ts`

```typescript
export { api, apiFetch, apiFetchMobile } from './client'
export { productsApi } from './products'
export { ordersApi } from './orders'
export { authApi } from './auth'
export { servicesApi } from './services'
export { projectsApi } from './projects'
export { paymentsApi } from './payments'
```

#### `packages/types/src/product.ts`

```typescript
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription?: string
  price: number
  salePrice?: number
  sku: string
  stock: number
  brandId: string
  brand?: Brand
  categoryId: string
  category?: Category
  images: string[]
  specifications: Record<string, string>
  rating?: number
  reviewCount?: number
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  image?: string
  parentId?: string
  parent?: Category
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo?: string
}

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
```

#### `packages/types/src/index.ts`

```typescript
export * from './product'
export * from './order'
export * from './user'
export * from './service'
export * from './project'
export * from './payment'
export * from './api'
```

#### `packages/store/src/storage.ts` (Storage Adapter)

```typescript
// Storage adapter — works on both web (localStorage) and mobile (AsyncStorage)

type Storage = {
  getItem: (key: string) => Promise<string | null> | string | null
  setItem: (key: string, value: string) => Promise<void> | void
  removeItem: (key: string) => Promise<void> | void
}

let storage: Storage | null = null

// Web auto-detection
if (typeof window !== 'undefined' && window.localStorage) {
  storage = window.localStorage
}

// Mobile: call this from app/_layout.tsx with AsyncStorage
export function setStorage(s: Storage) {
  storage = s
}

export function getStorage(): Storage {
  if (!storage) {
    throw new Error('Storage not configured. Call setStorage() first.')
  }
  return storage
}
```

#### `packages/store/src/cart.ts`

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getStorage } from './storage'
import type { CartItem } from '@epowerfix/types'

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return {
            items: [...state.items, { ...item, id: crypto.randomUUID() }],
          }
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),

      clearCart: () => set({ items: [] }),

      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'epowerfix-cart',
      storage: createJSONStorage(() => getStorage()),
    }
  )
)
```

### Step 8: Create Expo Mobile App

```bash
cd apps
bunx create-expo-app mobile --template tabs
cd mobile
```

#### `apps/mobile/package.json`

```json
{
  "name": "@epowerfix/mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "build:android": "eas build --platform android --profile production",
    "build:ios": "eas build --platform ios --profile production"
  },
  "dependencies": {
    "@epowerfix/api": "workspace:*",
    "@epowerfix/types": "workspace:*",
    "@epowerfix/store": "workspace:*",
    "@epowerfix/utils": "workspace:*",
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-secure-store": "~13.0.0",
    "expo-notifications": "~0.27.0",
    "expo-image": "~1.12.0",
    "expo-linear-gradient": "~13.0.0",
    "expo-status-bar": "~1.11.0",
    "expo-constants": "~16.0.0",
    "react": "18.2.0",
    "react-native": "0.74.2",
    "react-native-safe-area-context": "4.10.0",
    "react-native-screens": "3.31.0",
    "react-native-web": "~0.19.10",
    "@react-native-async-storage/async-storage": "1.23.1",
    "nativewind": "^2.0.11",
    "tailwindcss": "^3.4.0",
    "@expo/vector-icons": "^14.0.0",
    "react-native-reanimated": "~3.10.0",
    "react-native-gesture-handler": "~2.16.1",
    "@gorhom/bottom-sheet": "^4.6.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "tailwindcss": "^3.4.0"
  }
}
```

#### `apps/mobile/app/_layout.tsx` (Root Layout)

```tsx
import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setStorage } from '@epowerfix/store'

export default function RootLayout() {
  useEffect(() => {
    // Configure storage adapter for mobile
    setStorage(AsyncStorage as any)
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
          <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
          <Stack.Screen name="login" options={{ title: 'Login' }} />
        </Stack>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
```

#### `apps/mobile/app/(tabs)/_layout.tsx` (Bottom Tabs)

```tsx
import { Tabs } from 'expo-router'
import { Home, Shop, Wrench, ShoppingCart, User } from '@expo/vector-icons/Feather'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#71717a',
        tabBarStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <Shop color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) => <Wrench color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <ShoppingCart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  )
}
```

#### `apps/mobile/app/(tabs)/index.tsx` (Home Screen)

```tsx
import React, { useState, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { productsApi } from '@epowerfix/api'
import { useCartStore } from '@epowerfix/store'
import { formatPrice } from '@epowerfix/utils'
import type { Product } from '@epowerfix/types'

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    productsApi.list({ limit: 10 })
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        {/* Hero Banner */}
        <View className="bg-amber-500 p-6">
          <Text className="text-2xl font-bold text-white">ePowerFix</Text>
          <Text className="text-white/80">Electrical services & products</Text>
        </View>

        {/* Categories */}
        <View className="p-4">
          <Text className="mb-3 text-lg font-bold">Categories</Text>
          <View className="flex-row flex-wrap">
            {['Wiring', 'Switches', 'Lights', 'Tools', 'Projects'].map((cat) => (
              <Pressable
                key={cat}
                className="m-1 rounded-lg bg-gray-100 px-4 py-2"
              >
                <Text>{cat}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Products */}
        <View className="p-4">
          <Text className="mb-3 text-lg font-bold">Featured Products</Text>
          <FlatList
            data={products}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                className="mr-3 w-40 rounded-lg border border-gray-200 p-3"
                onPress={() => addToCart(item)}
              >
                <Text className="font-semibold">{item.name}</Text>
                <Text className="text-amber-600 font-bold">
                  {formatPrice(item.price)}
                </Text>
              </Pressable>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
```

### Step 9: Install Dependencies

```bash
cd /home/z/ePowerFix
bun install
```

This installs all dependencies for all apps and packages at once.

### Step 10: Run Dev Servers

```bash
# Run web + mobile together
bun run dev

# OR run separately
bun run dev:web      # Next.js on :3000
bun run dev:mobile   # Expo on :8081
```

---

## 🔄 How Shared Code Works

### Example: Product Fetch Flow

**Web (Next.js):**
```tsx
// apps/web/src/components/epf/ProductList.tsx
import { productsApi } from '@epowerfix/api'
import type { Product } from '@epowerfix/types'

export async function ProductList() {
  const { data: products } = await productsApi.list()
  return products.map(p => <div key={p.id}>{p.name}</div>)
}
```

**Mobile (Expo):**
```tsx
// apps/mobile/app/(tabs)/index.tsx
import { productsApi } from '@epowerfix/api'
import type { Product } from '@epowerfix/types'

export function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([])
  useEffect(() => {
    productsApi.list().then(res => setProducts(res.data))
  }, [])
  return products.map(p => <Text key={p.id}>{p.name}</Text>)
}
```

**Same API call, same types, different UI.** That's the power of monorepo.

### Example: Cart Logic

**Web cart button:**
```tsx
import { useCartStore } from '@epowerfix/store'

<button onClick={() => addItem({ ... })}>Add to Cart</button>
```

**Mobile cart button:**
```tsx
import { useCartStore } from '@epowerfix/store'

<Pressable onPress={() => addItem({ ... })}>Add to Cart</Pressable>
```

**Same store, same logic, different UI.**

---

## 📊 Migration Effort Estimate

| Task | Effort | Risk |
|------|--------|------|
| Set up Turborepo + monorepo structure | 1 day | Low |
| Move Next.js to apps/web/ | 1 day | Low |
| Create packages/types/ | 2 days | Low |
| Create packages/api/ | 2-3 days | Medium (extract from src/lib/) |
| Create packages/store/ | 1-2 days | Medium (storage adapter) |
| Create packages/utils/ | 1 day | Low |
| Update web imports | 1 day | Medium (find/replace) |
| Verify web still works | 1 day | Low |
| Create Expo mobile app | 1 day | Low |
| Build all mobile screens | 3-4 weeks | Medium |
| Test + submit to stores | 1 week | Low |
| **TOTAL** | **5-8 weeks** | — |

---

## ⚠️ Important: When to Do This

### Option A: Set Up Monorepo NOW (Before Any App Work)

**Pros:**
- Clean structure from start
- No future migration pain
- Shared code available immediately

**Cons:**
- 1 week of restructuring before you can build app
- Risk of breaking working website

### Option B: Set Up Monorepo LATER (After PWA + User Validation)

**Pros:**
- PWA works on current structure (zero restructuring)
- Validate user demand before investing in monorepo
- Lower risk — keep website stable

**Cons:**
- Future migration needed (but it's a one-time 1-week task)

### 🏆 Recommendation

**Go with Option B:**

1. **NOW (Week 1):** PWA on current structure — no monorepo needed
2. **Month 4+ (when native app needed):** Set up monorepo, then build mobile app

**Why?**
- PWA gives you 90% of app benefits with zero restructuring
- If PWA succeeds → monorepo + native app is worth the effort
- If PWA doesn't get traction → you saved 1 week of work

**The monorepo migration is always available as a future option.** Your backend code is already 100% reusable — the monorepo is just code organization.

---

## ✅ Summary

| Question | Answer |
|----------|--------|
| Do we need monorepo for app? | **YES** — it's the professional way |
| When to set it up? | **Month 4+** — after PWA validation |
| How long does setup take? | **1 week** (one-time) |
| Does backend change? | **NO** — 100% reusable |
| What's shared? | API client, types, stores, utils |
| What's NOT shared? | UI components, pages, routing |
| Tool? | **Turborepo** |
| Mobile framework? | **Expo (React Native)** |
| Styling? | **NativeWind** (Tailwind for RN) |

### Final Decision Tree

```
NOW
 ↓
Set up PWA on current structure (1 week, zero restructuring)
 ↓
Launch, market, get users (3-4 months)
 ↓
IF 5,000+ users OR 100+ daily orders:
   ↓
   Set up Turborepo monorepo (1 week)
   ↓
   Extract shared code to packages/ (1 week)
   ↓
   Build Expo mobile app (4-5 weeks)
   ↓
   Submit to Play Store + App Store
   ↓
   Now have: Web + PWA + Native App — all sharing code
```

---

## 📋 Agent Task Checklist

### Future Migration Tasks (When Ready)

| Task ID | Task | Effort |
|---------|------|--------|
| MONO-1 | Install Turborepo | 30 min |
| MONO-2 | Create root package.json (workspaces) | 30 min |
| MONO-3 | Create turbo.json | 30 min |
| MONO-4 | Create tsconfig.base.json | 30 min |
| MONO-5 | Move Next.js to apps/web/ | 1 day |
| MONO-6 | Create packages/types/ | 2 days |
| MONO-7 | Create packages/api/ | 2-3 days |
| MONO-8 | Create packages/store/ | 1-2 days |
| MONO-9 | Create packages/utils/ | 1 day |
| MONO-10 | Update web imports (@epowerfix/*) | 1 day |
| MONO-11 | Verify web app works | 1 day |
| MONO-12 | Add JWT auth endpoint for mobile | 1 day |
| MONO-13 | Add CORS config to API routes | 1 hour |
| MONO-14 | Create Expo app (apps/mobile/) | 1 day |
| MONO-15 | Install NativeWind | 1 hour |
| MONO-16 | Wire @epowerfix/* packages in mobile | 1 hour |
| MONO-17 | Build mobile screens (15 screens) | 3-4 weeks |
| MONO-18 | Test on Android | 2 days |
| MONO-19 | Test on iOS | 2 days |
| MONO-20 | Submit to Play Store | 1 day |
| MONO-21 | Submit to App Store | 1 day |

---

*End of document. See also: [LAUNCH_ROADMAP.md](./LAUNCH_ROADMAP.md), [APP_BUILD_GUIDE.md](./APP_BUILD_GUIDE.md), [STRUCTURE_ANALYSIS.md](./STRUCTURE_ANALYSIS.md)*
