# ePowerFix — Full Project Report
> Generated: 2026-07-23 | Status: ~70% Complete | Version: 0.3.0

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Full Directory Tree](#2-full-directory-tree)
3. [Tech Stack](#3-tech-stack)
4. [Configuration Files](#4-configuration-files)
5. [Routing Structure](#5-routing-structure)
6. [Components Inventory](#6-components-inventory)
7. [API & Backend](#7-api--backend)
8. [Database Schema](#8-database-schema)
9. [Styling & Design System](#9-styling--design-system)
10. [State Management](#10-state-management)
11. [Authentication & Security](#11-authentication--security)
12. [Environment Variables](#12-environment-variables)
13. [Mobile App](#13-mobile-app)
14. [Shared Packages](#14-shared-packages)
15. [Build & Deployment](#15-build--deployment)
16. [Known Issues & TODOs](#16-known-issues--todos)
17. [Project Statistics](#17-project-statistics)

---

## 1. Project Overview

**ePowerFix** is a full-stack e-commerce + services platform for Bangladesh's electrical market.

| | |
|---|---|
| **Name** | ePowerFix |
| **Version** | 0.3.0 |
| **Type** | Bun Monorepo (Turborepo) |
| **Market** | Bangladesh electrical products & services |
| **Languages** | Bengali (primary), English (fallback) |
| **Package Manager** | Bun 1.3.14 |

### Apps in Monorepo
| App | Tech | Port | Purpose |
|-----|------|------|---------|
| `apps/web` | Next.js 16 + React 19 | 3000 | Storefront + Admin Dashboard |
| `apps/api` | Express 5 + Bun | 4000 | REST API Server |
| `apps/mobile` | Expo 57 + RN 0.86 | — | Android/iOS App |

### Shared Packages
| Package | Purpose |
|---------|---------|
| `@epowerfix/api-client` | HTTP client + API endpoint definitions |
| `@epowerfix/store` | Zustand cart store (web + mobile compatible) |
| `@epowerfix/types` | Shared TypeScript interfaces |
| `@epowerfix/utils` | Formatting, slugify, config constants |

---

## 2. Full Directory Tree

```
epowerfix/                              ← Monorepo root
├── apps/
│   ├── web/                            ← Next.js 16 App
│   │   ├── src/
│   │   │   ├── app/                    ← App Router (55+ routes)
│   │   │   │   ├── layout.tsx          ← Root layout + providers
│   │   │   │   ├── page.tsx            ← Homepage
│   │   │   │   ├── globals.css         ← Global styles + CSS vars
│   │   │   │   ├── (auth)/             ← Login, register
│   │   │   │   ├── shop/[id]/          ← Product detail
│   │   │   │   ├── services/           ← Service listing + detail
│   │   │   │   ├── projects/           ← Portfolio listing + detail
│   │   │   │   ├── project-kits/       ← Project kits
│   │   │   │   ├── blog/               ← Blog listing + posts
│   │   │   │   ├── cart/               ← Shopping cart
│   │   │   │   ├── checkout/           ← Checkout flow
│   │   │   │   ├── profile/            ← Customer account
│   │   │   │   ├── electricians/       ← Find electricians
│   │   │   │   ├── electrician/        ← Provider dashboard
│   │   │   │   ├── deals/              ← Flash deals
│   │   │   │   ├── compare/            ← Product comparison
│   │   │   │   ├── wishlist/           ← Saved items
│   │   │   │   ├── order-track/        ← Track orders
│   │   │   │   ├── payment/            ← Payment callbacks
│   │   │   │   ├── contact/            ← Contact form
│   │   │   │   └── admin/              ← Admin dashboard (45+ pages)
│   │   │   │       ├── page.tsx        ← Admin home
│   │   │   │       ├── products/       ← Product management
│   │   │   │       ├── orders/         ← Order management
│   │   │   │       ├── users/          ← User management
│   │   │   │       ├── services/       ← Service management
│   │   │   │       ├── electricians/   ← Marketplace admin
│   │   │   │       ├── blog/           ← Content management
│   │   │   │       ├── banners/        ← Banner management
│   │   │   │       ├── settings/       ← Site settings
│   │   │   │       ├── finance/        ← Financial reports
│   │   │   │       └── security/       ← Audit logs
│   │   │   ├── components/
│   │   │   │   ├── epf/                ← ePowerFix brand components
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   ├── HeroBanner.tsx
│   │   │   │   │   ├── CategoryGrid.tsx
│   │   │   │   │   ├── FlashDeals.tsx
│   │   │   │   │   ├── BestDeals.tsx
│   │   │   │   │   ├── ServicesSection.tsx
│   │   │   │   │   ├── ServicesBanner.tsx
│   │   │   │   │   ├── BrandStrip.tsx
│   │   │   │   │   ├── ProjectsSection.tsx
│   │   │   │   │   ├── ProductCard.tsx
│   │   │   │   │   ├── ShopSection.tsx
│   │   │   │   │   ├── TrustBar.tsx
│   │   │   │   │   ├── AnnouncementBar.tsx
│   │   │   │   │   └── RecentlyViewed.tsx
│   │   │   │   ├── admin/              ← Admin UI components
│   │   │   │   ├── marketplace/        ← Marketplace UI
│   │   │   │   ├── ui/                 ← Radix/shadcn primitives
│   │   │   │   ├── AuthProvider.tsx
│   │   │   │   ├── CartSyncProvider.tsx
│   │   │   │   └── SiteThemeProvider.tsx
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts             ← NextAuth config
│   │   │   │   ├── api.ts              ← API helpers
│   │   │   │   └── utils.ts
│   │   │   └── hooks/                  ← Custom React hooks
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   ├── api/                            ← Express 5 API Server
│   │   ├── src/
│   │   │   ├── index.ts                ← Entry point
│   │   │   ├── server.ts               ← Express app + middleware
│   │   │   ├── routes/                 ← 25+ route modules
│   │   │   │   ├── auth.ts
│   │   │   │   ├── products.ts
│   │   │   │   ├── orders.ts
│   │   │   │   ├── payments.ts
│   │   │   │   ├── marketplace.ts
│   │   │   │   └── admin/             ← 30+ admin routes
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── payment.ts
│   │   │   │   └── marketplace.ts
│   │   │   └── config/
│   │   │       └── env.ts              ← Zod env validation
│   │   └── package.json
│   │
│   └── mobile/                         ← Expo React Native App
│       ├── app/                        ← Expo Router screens
│       │   ├── _layout.tsx             ← Root Stack navigator
│       │   ├── (tabs)/
│       │   │   ├── _layout.tsx         ← Bottom tab bar
│       │   │   ├── index.tsx           ← Home screen (12 sections)
│       │   │   ├── shop.tsx
│       │   │   ├── services.tsx
│       │   │   ├── marketplace.tsx
│       │   │   └── profile.tsx
│       │   ├── product/[id].tsx
│       │   ├── login.tsx
│       │   ├── register.tsx
│       │   ├── checkout.tsx
│       │   ├── orders.tsx
│       │   ├── wishlist.tsx
│       │   ├── notifications.tsx
│       │   ├── addresses.tsx
│       │   ├── order-track.tsx
│       │   ├── service-booking.tsx
│       │   └── marketplace/
│       │       ├── index.tsx
│       │       ├── new-request.tsx
│       │       ├── request/[id].tsx
│       │       └── job/[id].tsx
│       ├── src/
│       │   ├── components/
│       │   │   ├── PremiumCard.tsx
│       │   │   ├── Footer.tsx
│       │   │   └── CartSyncProvider.tsx
│       │   ├── store/
│       │   │   ├── auth.ts
│       │   │   └── wishlist.ts
│       │   └── theme/
│       │       ├── colors.ts
│       │       └── design-system.ts
│       ├── assets/
│       │   ├── favicon.png
│       │   ├── icon.png
│       │   └── splash.png
│       ├── app.json
│       ├── eas.json
│       ├── babel.config.js
│       ├── metro.config.js
│       └── package.json
│
├── packages/
│   ├── api-client/src/index.ts         ← Unified HTTP client
│   ├── store/src/index.ts              ← Shared cart store
│   ├── types/src/
│   │   ├── index.ts
│   │   └── marketplace.ts
│   └── utils/src/index.ts
│
├── prisma/
│   └── schema.prisma                   ← 55 models, PostgreSQL
│
├── docs/                               ← Documentation
├── .github/workflows/
│   └── eas-build.yml                   ← Auto EAS build on push
├── turbo.json
├── tsconfig.base.json
├── package.json                        ← Root workspace config
├── bun.lock
└── Dockerfile                          ← Railway production build
```

---

## 3. Tech Stack

### Core
| Layer | Technology | Version |
|-------|-----------|---------|
| **Web Framework** | Next.js | 16.1.1 |
| **Mobile Framework** | Expo | 57.0.8 |
| **API Framework** | Express | 5.2.1 |
| **Language** | TypeScript | 5.7+ / 6.0 (mobile) |
| **Runtime** | Bun | 1.3.14 |
| **React** | React | 19.0.0 (web) / 19.2.3 (mobile) |
| **React Native** | React Native | 0.86.0 |
| **Build System** | Turborepo | 2.3.3 |

### Database & ORM
| | Technology |
|---|---|
| **Database** | PostgreSQL |
| **ORM** | Prisma 6.19.3 |
| **Cache** | Upstash Redis |

### Auth & Security
| | Technology |
|---|---|
| **Web Auth** | NextAuth v5 (beta) |
| **API Auth** | JWT (jose 6.2.3) |
| **Mobile Auth** | JWT + SecureStore |
| **Password** | bcryptjs 3.0.3 |
| **Security Headers** | Helmet 8.3.0 |
| **Rate Limiting** | express-rate-limit 8.5.2 |

### UI & Styling (Web)
| | Technology |
|---|---|
| **CSS** | Tailwind CSS v4 |
| **UI Components** | Radix UI (25+ components) |
| **Design System** | shadcn/ui style |
| **Animation** | Framer Motion 12.23.2 |
| **Icons** | Lucide React |
| **Forms** | React Hook Form + Zod |
| **Carousel** | Embla Carousel |
| **Charts** | Recharts 2.15.4 |
| **Toast** | Sonner 2.0.6 |
| **Drag & Drop** | @dnd-kit suite |

### Payment Gateways
| Gateway | Type |
|---------|------|
| **bKash** | Mobile payment |
| **Nagad** | Mobile wallet |
| **SSLCommerz** | Card/internet banking |
| **Cash on Delivery** | Manual |
| **Bank Transfer** | Manual |

### State Management
| App | Library |
|-----|---------|
| **Web** | Zustand 5.0.6 + React Query 5.82.0 |
| **Mobile** | Zustand 3.5.6 + AsyncStorage |
| **Shared Cart** | @epowerfix/store (Zustand) |

### i18n
| | |
|---|---|
| **Library** | next-intl 4.3.4 |
| **Languages** | Bengali (bn-BD), English (en) |
| **Fonts** | Noto Sans Bengali, Inter |

---

## 4. Configuration Files

### `package.json` (root)
```json
{
  "name": "epowerfix",
  "version": "0.3.0",
  "workspaces": ["apps/*", "packages/*"],
  "packageManager": "bun@1.3.14",
  "engines": { "node": ">=22.0.0", "bun": "1.3.14" },
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "typecheck": "bun run --cwd apps/api typecheck && ...",
    "dev:web": "turbo dev --filter=@epowerfix/web",
    "dev:api": "turbo dev --filter=@epowerfix/api",
    "dev:mobile": "bun run --cwd apps/mobile dev",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "bun prisma/seed.ts"
  }
}
```

### `apps/mobile/app.json`
```json
{
  "expo": {
    "name": "ePowerFix",
    "slug": "epowerfix",
    "version": "1.0.0",
    "icon": "./assets/icon.png",
    "scheme": "epowerfix",
    "owner": "epowerfix",
    "runtimeVersion": { "policy": "appVersion" },
    "updates": { "url": "https://u.expo.dev/c19c58d0-..." },
    "android": {
      "package": "com.epowerfix.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon.png",
        "backgroundColor": "#0EA5E9"
      }
    },
    "ios": { "bundleIdentifier": "com.epowerfix.app" },
    "plugins": [
      "expo-router", "expo-font", "expo-secure-store",
      ["expo-splash-screen", {
        "backgroundColor": "#0EA5E9",
        "image": "./assets/favicon.png"
      }]
    ]
  }
}
```

### `apps/mobile/eas.json`
```json
{
  "build": {
    "development": { "developmentClient": true, "channel": "development" },
    "preview": { "distribution": "internal", "channel": "preview" },
    "production": { "channel": "production", "autoIncrement": true }
  }
}
```

---

## 5. Routing Structure

### Web — Public Routes
| Route | Page |
|-------|------|
| `/` | Homepage (12 sections) |
| `/shop/[id]` | Product detail |
| `/services` | Service listing |
| `/services/[slug]` | Service detail |
| `/projects` | Portfolio projects |
| `/projects/[slug]` | Project detail |
| `/project-kits` | Project kits |
| `/project-kits/[slug]` | Kit detail |
| `/blog` | Blog listing |
| `/blog/[slug]` | Blog post |
| `/deals` | Flash deals |
| `/compare` | Product comparison |
| `/electricians` | Find electricians |
| `/contact` | Contact form |

### Web — Auth Routes
| Route | Page |
|-------|------|
| `/login` | User login |
| `/register` | Registration |

### Web — Customer Routes
| Route | Page |
|-------|------|
| `/cart` | Shopping cart |
| `/checkout` | Checkout |
| `/profile` | Account dashboard |
| `/wishlist` | Saved items |
| `/order-track` | Track order |
| `/payment/success` | Payment success |
| `/payment/fail` | Payment failure |
| `/book-service/[id]` | Book electrician |
| `/get-quote` | Request quote |
| `/cost-estimator` | Cost calculator |
| `/electrician/dashboard` | Provider dashboard |

### Web — Admin Routes (45+)
| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard |
| `/admin/products` | Product CRUD |
| `/admin/products/[id]` | Edit product |
| `/admin/orders` | Order management |
| `/admin/orders/[id]` | Order detail |
| `/admin/users` | User management |
| `/admin/services` | Services CRUD |
| `/admin/electricians` | Marketplace providers |
| `/admin/electricians/[id]` | Provider review |
| `/admin/blog` | Blog management |
| `/admin/banners` | Banner management |
| `/admin/settings` | Site settings |
| `/admin/finance` | Financial reports |
| `/admin/security` | Audit logs |
| `/admin/ai-providers` | AI configuration |

### API Routes (Express)
| Method | Route | Auth |
|--------|-------|------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/register` | Public |
| GET | `/api/products` | Public |
| GET | `/api/products/:id` | Public |
| GET | `/api/categories` | Public |
| GET | `/api/services` | Public |
| GET | `/api/orders` | Customer |
| POST | `/api/orders` | Customer |
| GET | `/api/wishlist` | Customer |
| POST | `/api/payments/initiate` | Customer |
| POST | `/api/payments/callback` | Webhook |
| GET | `/api/marketplace-requests` | Customer |
| POST | `/api/marketplace-requests` | Customer |
| GET | `/api/admin/products` | Admin |
| POST | `/api/admin/products` | Admin |
| GET | `/api/admin/marketplace/providers` | Admin |
| GET | `/api/health` | Public |

### Mobile Routes (Expo Router)
| Route | Screen |
|-------|--------|
| `/(tabs)` | Bottom tab navigator |
| `/(tabs)/index` | Home (12 sections) |
| `/(tabs)/shop` | Product list |
| `/(tabs)/services` | Services |
| `/(tabs)/marketplace` | Marketplace entry |
| `/(tabs)/profile` | Account |
| `/product/[id]` | Product detail |
| `/login` | Login |
| `/register` | Register |
| `/checkout` | Checkout |
| `/orders` | Order history |
| `/wishlist` | Wishlist |
| `/marketplace/index` | Job list |
| `/marketplace/new-request` | Create request |
| `/marketplace/request/[id]` | Request detail |
| `/marketplace/job/[id]` | Job detail |

---

## 6. Components Inventory

### Web — epf/ (Brand Components)
| Component | Purpose |
|-----------|---------|
| `Header.tsx` | Navigation, search, cart, auth |
| `Footer.tsx` | Links, newsletter, social |
| `HeroBanner.tsx` | Homepage hero slider |
| `AnnouncementBar.tsx` | Top announcement strip |
| `TrustBar.tsx` | Trust indicators (free shipping, returns) |
| `CategoryGrid.tsx` | Product category grid |
| `FlashDeals.tsx` | Countdown flash sale products |
| `ShopSection.tsx` | Featured product grid |
| `BestDeals.tsx` | Best sellers section |
| `ServicesSection.tsx` | Electrical services grid |
| `ServicesBanner.tsx` | Book electrician CTA |
| `BrandStrip.tsx` | Brand logo carousel |
| `ProjectsSection.tsx` | Portfolio project gallery |
| `ProductCard.tsx` | Product card (cart, wishlist, compare) |
| `RecentlyViewed.tsx` | Recently viewed products |

### Web — ui/ (Radix Primitives)
`Button`, `Input`, `Select`, `Dialog`, `Dropdown`, `Toast`, `Tabs`, `Accordion`, `Badge`, `Card`, `Table`, `Pagination`, `Skeleton`, `Avatar`, `Checkbox`, `Switch`, `Slider`, `Progress`, `Alert`, `Tooltip`, `Popover`, `Sheet`, `Separator`, `Label`, `Textarea` (25+)

### Mobile Components
| Component | Purpose |
|-----------|---------|
| `PremiumCard.tsx` | Product card + skeleton loader |
| `Footer.tsx` | App footer |
| `CartSyncProvider.tsx` | Cart persistence bridge |

---

## 7. API & Backend

### Server Setup (`apps/api/src/server.ts`)
```
Port: 4000 (dev) | 0.0.0.0 (prod)
Middleware: Helmet → CORS → JSON Parser → Cookie Parser → Morgan → Rate Limiter
```

### Middleware Stack
1. `helmet()` — Security headers
2. `compression()` — Gzip
3. `cors()` — Web + Mobile origins
4. `express.json({ limit: '10mb' })`
5. `cookieParser()`
6. `morgan('dev')` — Logging
7. `rateLimit()` — 1000/15min (API), 50/15min (Auth)

### Payment Flow
```
Customer → POST /api/payments/initiate
→ Generate idempotency key
→ Reserve inventory
→ Redirect to gateway (bKash/Nagad/SSLCommerz)
→ Gateway POST /api/payments/callback
→ Verify signature + IP whitelist
→ Confirm order → Release inventory
```

---

## 8. Database Schema

### Models (55 total)

**User & Auth (3)**
- `User` — Profile, role, auth fields
- `UserAddress` — Delivery addresses
- `Notification` — User notifications

**Products (8)**
- `Product` — Main entity (digital + physical, specs JSON)
- `ProductCategory` — Hierarchical categories
- `ProductVariant` — Size/color/options
- `Brand` — Brand master
- `CartItem` — Shopping cart
- `Wishlist` — Saved items
- `FlashSale` — Time-limited promotions
- `Tax` — Tax rules

**Orders & Payments (9)**
- `Order` — Main order (status, payment, shipping)
- `OrderItem` — Line items
- `OrderHistory` — Status audit trail
- `Payment` — Payment records
- `Coupon` + `CouponUsage` — Discount codes
- `Shipment` + `ShipmentHistory` — Delivery tracking
- `ReturnRequest` — Returns/refunds

**Services (4)**
- `Service`, `ServiceCategory` — Service catalog
- `ServiceBooking` — Legacy bookings
- `Review` — Product/service reviews

**Content (3)**
- `BlogPost`, `QuoteRequest`, `Contact`

**Projects (4)**
- `Project`, `ProjectKit`, `ProjectKitItem`, `ProductQuestion`

**Site Settings (3)**
- `SiteSettings` — Global config + payment gateway keys
- `Banner` — Promotional banners
- `AiProvider` — AI model config

**Marketplace (29 models)**
- `ProviderProfile`, `ProviderDocument`, `ProviderSkill`
- `ProviderServiceZone`, `ProviderAvailability`, `ProviderTimeOff`
- `Skill`, `GeoDivision`, `GeoDistrict`, `GeoUpazila`, `ServiceZone`
- `MarketplaceServiceRequest`, `ServiceRequestAttachment`
- `MarketplaceJob`, `JobAssignment`, `JobStatusHistory`
- `MarketplaceQuote`, `QuoteLineItem`
- `MarketplacePayment`, `FinancialLedgerEntry`
- `ProviderPayout`, `ProviderPayoutItem`
- `MarketplaceReview`, `MarketplaceWarrantyClaim`, `MarketplaceDispute`
- `ArrivalOtp`, `ProviderLocationPing`
- `NotificationDelivery`, `MarketplaceAuditEvent`, `MarketplaceSetting`

---

## 9. Styling & Design System

### Approach
- **Tailwind CSS v4** — Utility classes
- **CSS Variables** — HSL-based theming
- **Dark Mode** — Class-based (`.dark`)
- **Custom Tokens** — `epf-*`, `dark-*` prefixes

### Color System
```css
/* Brand */
--color-epf-500: #0EA5E9;    /* Primary — Sky Blue */
--color-epf-600: #0284C7;    /* Hover */
--color-epf-100: #E0F2FE;    /* Light background */

/* UI (HSL) */
--primary: 199 89% 48%;      /* = #0EA5E9 */
--background: 220 14% 96%;
--foreground: 222 47% 11%;
--card: 0 0% 100%;
--sidebar: 210 60% 14%;      /* Dark navy admin sidebar */

/* Status */
--color-success: #4D7300;
--color-warning: #F59E0B;
--color-danger: #DC2626;

/* Gray scale */
--color-dark-50:  #F9FAFB;
--color-dark-900: #111827;
```

### Mobile Theme (`src/theme/design-system.ts`)
```typescript
Colors = {
  primary: '#0EA5E9',
  dark: '#0F172A',
  white: '#FFFFFF',
  // slate scale: 50–900
}
```

### Global CSS Features
- Custom scrollbar (5px, minimal)
- Product card hover animations
- Selection color override (`#0EA5E9`)
- Smooth scroll with `scroll-padding-top: 120px`

---

## 10. State Management

### Web — Zustand Stores
```typescript
// @epowerfix/store
useCartStore() → {
  items: CartItem[],
  addItem(), removeItem(), updateQty(),
  clearCart(), total, count
}

// apps/web — SiteThemeProvider
useSiteTheme() → { primaryColor, setColor }
```

### Mobile — Zustand Stores
```typescript
// src/store/auth.ts
useAuthStore() → {
  token: string | null,
  user: User | null,
  setToken(), clearToken(), isLoggedIn
}

// src/store/wishlist.ts
useWishlistStore() → {
  items: string[],
  toggle(), isWishlisted(), loaded
}
```

### Server State — React Query (Web)
```typescript
useQuery(['products'], () => productsApi.list())
useQuery(['product', id], () => productsApi.getById(id))
useMutation(() => ordersApi.create(payload))
```

---

## 11. Authentication & Security

### Web Flow (NextAuth v5)
```
POST /api/auth/callback/credentials
→ Verify email + bcrypt password
→ Generate JWT session
→ Set httpOnly cookie
→ Redirect to dashboard
```

### API Flow (JWT Bearer)
```
POST /api/auth/login
→ Returns { token, user }
→ Client stores token
→ All requests: Authorization: Bearer {token}
```

### Mobile Flow (SecureStore)
```
POST /api/auth/login → token
→ setApiToken(token) → SecureStore.setItem('token', token)
→ App restart: SecureStore.getItem('token') → restore session
```

### Security Headers (Next.js)
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000
Permissions-Policy: camera=(), microphone=()
```

---

## 12. Environment Variables

### Required
```env
DATABASE_URL=postgresql://user:pass@host:5432/epowerfix
NODE_ENV=development | production
PORT=4000
JWT_SECRET=min-32-chars-random-string
WEB_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### Payment Gateways
```env
PAYMENT_TEST_MODE=true
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWD=
BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_CALLBACK_URL=
NAGAD_MERCHANT_ID=
NAGAD_CALLBACK_URL=
PAYMENT_CALLBACK_IP_WHITELIST=
```

### Cloud & Monitoring
```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN=
```

### Feature Flags
```env
MARKETPLACE_ENABLED=false
PROVIDER_ONBOARDING_ENABLED=false
MARKETPLACE_PAYMENTS_ENABLED=false
LIVE_TRACKING_ENABLED=false
AUTO_MATCHING_ENABLED=false
```

---

## 13. Mobile App

### Build Configuration
| | |
|---|---|
| **EAS Project ID** | `c19c58d0-fd50-4fe7-afeb-20252f773e5f` |
| **Owner** | `epowerfix` |
| **Android Package** | `com.epowerfix.app` |
| **iOS Bundle** | `com.epowerfix.app` |
| **Splash BG** | `#0EA5E9` |
| **OTA Updates** | Expo EAS Update (branch: preview) |

### Home Screen Sections
1. Hero Banner (Bengali title + dual CTA)
2. Trust Bar
3. Category Grid
4. Flash Deals (countdown timer)
5. Best Deals
6. Shop Section (products grid)
7. Services Section
8. Electrician CTA Banner
9. Brand Strip
10. Projects Gallery
11. Why ePowerFix (trust section)
12. Footer

### Bottom Tabs
| Tab | Icon | Screen |
|-----|------|--------|
| Home | House | `/(tabs)/index` |
| Shop | ShoppingBag | `/(tabs)/shop` |
| Services | Wrench | `/(tabs)/services` |
| Electrician | Zap | `/(tabs)/marketplace` |
| Account | User | `/(tabs)/profile` |

---

## 14. Shared Packages

### `@epowerfix/api-client`
```typescript
// Base fetch
apiFetch<T>(endpoint, options) → Promise<T>

// API namespaces
productsApi.list(params)
productsApi.getById(id)
ordersApi.create(payload)
ordersApi.list()
marketplaceRequestsApi.create(payload)
marketplaceAdminProvidersApi.list()
// ... 15+ namespaces

// Token management
setApiToken(token: string)
getApiToken() → string | null
```

### `@epowerfix/store`
```typescript
useCartStore() → CartStore
setStorage(adapter) // localStorage (web) or AsyncStorage (mobile)

// Cart utilities
getCartItemEntityId(item) → string
mergeCartItems(local, server) → CartItem[]
toOrderItemPayload(items) → OrderItemPayload[]
```

### `@epowerfix/types`
```typescript
// Core
interface User { id, email, name, role, ... }
interface Product { id, name, price, stock, images, ... }
interface Order { id, items, total, status, payment, ... }
interface MarketplaceServiceRequest { ... }
interface MarketplaceAdminProviderDetail { ... }

// Enums
type UserRole = 'CUSTOMER' | 'ADMIN' | 'PROVIDER' | 'STAFF'
type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
```

### `@epowerfix/utils`
```typescript
formatPrice(amount, currency) → '৳1,234'
formatDate(date, locale) → '২৩ জুলাই ২০২৬'
slugify(text) → 'product-name'
generateId() → 'uuid-v4'
cn(...classes) → 'merged class string'

APP_CONFIG = {
  name: 'ePowerFix',
  currency: 'BDT',
  locale: 'bn-BD'
}
```

---

## 15. Build & Deployment

### Local Development
```bash
bun install           # Install all dependencies
bun run db:generate   # Generate Prisma client
bun run db:migrate    # Apply DB migrations
bun run db:seed       # Seed initial data
bun run dev           # Start all apps (Turbo)
```

### Individual Services
```bash
bun run dev:web       # Next.js → localhost:3000
bun run dev:api       # Express → localhost:4000
bun run dev:mobile    # Expo → QR code
```

### Production Build
```bash
bun run build         # Build all apps
bun run typecheck     # TypeScript validation
bun run check         # Full check (typecheck + tests)
```

### Deployment
| App | Platform | Method |
|-----|----------|--------|
| **Web** | Vercel | Git push → auto deploy |
| **API** | Railway | Dockerfile → auto deploy |
| **Mobile** | EAS Build | `bun run eas build` |
| **Mobile OTA** | EAS Update | `bun run eas update` |

### GitHub Actions (Auto EAS Build)
```yaml
# .github/workflows/eas-build.yml
Trigger: push to main (apps/mobile/** changes)
Action: expo/expo-github-action@v8
Secret: EXPO_TOKEN (set in GitHub repo settings)
```

---

## 16. Known Issues & TODOs

### 🔴 Critical (Blockers)
| Issue | Location | Impact |
|-------|----------|--------|
| API TypeScript errors (157+) | `apps/api/src/routes/*.ts` | Build warnings |
| Image upload not implemented | `apps/api/src/routes/admin/` | Cannot upload images |
| Cart sync placeholder | `apps/api/src/routes/cart.ts` | Cart not server-synced |
| Mobile cart not persisting | `apps/mobile/app/(tabs)/shop.tsx` | Shopping broken |

### 🟡 Moderate
| Issue | Location | Impact |
|-------|----------|--------|
| Email notifications missing | No email service | No order confirmations |
| Admin charts hardcoded | `apps/web/src/app/admin/` | Metrics not real |
| Marketplace incomplete | Multiple files | Limited marketplace |
| `/deals` page missing | `apps/web/src/app/` | 404 on footer link |
| Mobile product images emoji | `apps/mobile/app/product/` | Visual issue |

### 🟢 Minor
| Issue | Location |
|-------|----------|
| Mobile wishlist not fully functional | `apps/mobile/app/(tabs)/profile.tsx` |
| Guest checkout payment flow unclear | `apps/web/src/app/checkout/` |
| Marketplace auto-matching not implemented | `apps/api/src/lib/marketplace.ts` |
| Seed data creates no products | `prisma/seed.ts` |

### TODO Comments in Code
- `// TODO: implement image upload with Cloudinary`
- `// TODO: send email notification`
- `// TODO: implement auto-matching algorithm`
- `// TODO: wire up real analytics data`

---

## 17. Project Statistics

| Metric | Count |
|--------|-------|
| Total Web Routes | 55+ |
| Admin Pages | 45+ |
| API Endpoints | 40+ |
| Database Models | 55 |
| Shared Packages | 4 |
| Radix UI Components | 25+ |
| Mobile Screens | 15+ |
| Payment Gateways | 4 |
| API TypeScript Errors | 157+ |
| Total Dependencies | 200+ |

### Completion Status
```
Overall:              ████████████████░░░░  ~70%
Web (Storefront):     ██████████████████░░  ~85%
Web (Admin):          ████████████████░░░░  ~75%
API Server:           ██████████████░░░░░░  ~65%
Mobile App:           ████████████░░░░░░░░  ~55%
Marketplace:          ██████████░░░░░░░░░░  ~45%
Database Schema:      ████████████████████  100%
```

### Deployment Status
| Service | Status |
|---------|--------|
| Web (Vercel) | ✅ Deployed |
| API (Railway) | ✅ Deployed |
| Mobile (EAS) | 🔄 Build in progress |
| OTA Update | ✅ Published (branch: preview) |

---

*Report generated by analyzing the full ePowerFix monorepo codebase.*
*For questions or updates, refer to `/docs/PROJECT_AUDIT_AND_ROADMAP.md`*
