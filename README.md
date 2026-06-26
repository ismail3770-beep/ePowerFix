# ePowerFix — Electrical Power & Digital Technology

> Bangladesh's trusted online marketplace for electrical products, services, and tools.

**Live:** [epowerfix.com](https://epowerfix.com) | **Language:** Bengali (বাংলা) + English

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack & Languages](#tech-stack--languages)
- [Architecture — Monorepo Structure](#architecture--monorepo-structure)
- [Project Structure](#project-structure)
- [Database Schema (17 Models)](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [API Overview](#api-overview)
- [Payment Integrations](#payment-integrations)
- [Admin Panel](#admin-panel)
- [Deployment](#deployment)
- [Project Stats](#project-stats)

---

## Overview

ePowerFix is a full-featured e-commerce platform built for the electrical industry in Bangladesh. It combines an online product shop, professional service booking, electrical calculation tools, project showcase, and a blog — all in a single monorepo.

The website is bilingual (Bengali + English) and designed for the Bangladeshi market with BDT (৳) currency and local payment gateway integrations (bKash, Nagad, SSLCommerz).

---

## Features

### Customer-Facing
- **Product Shop** — Browse, search, filter products by category, brand, price range with wishlist support
- **Flash Deals** — Time-limited deals with countdown timer
- **Service Booking** — Book electrical services (wiring, solar, automation) with date/time selection
- **Electrical Tools** — 8 built-in calculators (cable size, voltage drop, LED savings, battery backup, load calculator, etc.)
- **Project Showcase** — Portfolio of completed electrical/solar/automation projects
- **Blog** — Markdown-based blog with Bengali/English support
- **Checkout** — Full checkout flow with coupon codes, area-based delivery fee, 4 payment methods
- **Chat Widget** — AI-powered chatbot with preset electrical FAQs
- **Newsletter** — Email subscription with delayed popup
- **Responsive Design** — Mobile-first with Bengali font support (Noto Sans Bengali)
- **Dark/Light Theme** — Toggle via next-themes
- **SEO** — Full SEO with sitemap, robots.txt, OpenGraph, structured metadata

### Admin Panel
- **Dashboard** — Revenue stats, order charts, recent activities
- **Product Management** — Full CRUD with image upload, specifications, stock tracking
- **Service Management** — CRUD with categories, pricing (fixed/per-sqft/per-point/per-watt)
- **Order Management** — Status tracking, payment status updates
- **Customer Management** — User list, activation, role management
- **Blog Management** — MDX editor with live preview
- **Booking Management** — Service booking approval and status updates
- **Coupon Management** — Create percentage/fixed discount coupons with usage limits
- **Brand Management** — Brand logos, sorting, country info
- **Quote Request Management** — B2B quote requests with reply tracking
- **Contact Messages** — Inbox for customer inquiries
- **Newsletter Subscribers** — Manage email subscribers

---

## Tech Stack & Languages

| Category | Technology | Purpose |
|---|---|---|
| **Language** | TypeScript 5 | Primary language (100% TypeScript) |
| **Frontend Framework** | Next.js 16 (App Router) | React 19 SSR/SSG framework |
| **UI Library** | React 19 | Component rendering |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **UI Components** | shadcn/ui (New York) | 48 pre-built accessible components |
| **Icons** | Lucide React | Icon library |
| **Animations** | Framer Motion | Page transitions, micro-interactions |
| **Backend (API)** | Express.js 4 | REST API server |
| **Database ORM** | Prisma 6 | Type-safe database queries |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Relational database |
| **Authentication** | JWT (jose) | Express-issued JWT sessions (cookie + Bearer) |
| **State Management** | Zustand 5 | Client-side state (cart, UI, auth) |
| **Server State** | TanStack Query 5 | API data caching & fetching |
| **Validation** | Zod 4 | Schema validation (forms & API) |
| **Charts** | Recharts 2 | Admin dashboard charts |
| **Forms** | React Hook Form 7 | Form state management |
| **Markdown** | React Markdown + MDXEditor | Blog content rendering & editing |
| **Monorepo** | Turborepo 2 | Build orchestration & caching |
| **Package Manager** | Bun 1.3 | Fast JS runtime & package manager |
| **Containerization** | Docker + Docker Compose | Production deployment |
| **Security** | Helmet, CSP headers | HTTP security middleware |

---

## Architecture — Monorepo Structure

This project uses a **Turborepo monorepo** with two applications and two shared packages:

```
epowerfix/
├── apps/
│   ├── web/          → Next.js 16 frontend (Port 3000)
│   └── api/          → Express.js REST API (Port 4000)
├── packages/
│   ├── db/           → Prisma schema, client, & seed data
│   └── types/        → Shared TypeScript enums & interfaces
├── package.json      → Root workspace config
└── turbo.json        → Turborepo task pipeline
```

### How it works:

1. **`@epowerfix/web`** (apps/web) — The Next.js frontend. Contains all React components, pages, and Next.js API route handlers. This is the primary app users interact with.

2. **`@epowerfix/api`** (apps/api) — A standalone Express.js API server with identical endpoints. This is the production-ready backend that can replace the Next.js route handlers. It has its own middleware (auth, rate limiting, validation).

3. **`@epowerfix/db`** (packages/db) — Shared Prisma package. Contains the database schema (`schema.prisma`), PrismaClient singleton, and seed data. Both `web` and `api` import from this package.

4. **`@epowerfix/types`** (packages/types) — Pure TypeScript types. Contains 10 enums, 28 interfaces used across the entire monorepo. Zero runtime dependencies.

---

## Project Structure

```
epowerfix/
├── apps/
│   ├── web/                                    # Next.js 16 Frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── page.tsx                    # Home page (12 sections)
│   │   │   │   ├── layout.tsx                  # Root layout (fonts, providers)
│   │   │   │   ├── globals.css                 # Global styles
│   │   │   │   ├── admin/                      # Admin dashboard page
│   │   │   │   ├── blog/                       # Blog listing & [slug] detail
│   │   │   │   ├── deals/                      # Flash deals page
│   │   │   │   ├── login/                      # Login page
│   │   │   │   ├── register/                   # Registration page
│   │   │   │   ├── profile/                    # User profile page
│   │   │   │   ├── projects/                   # Project showcase page
│   │   │   │   ├── services/                   # Services listing page
│   │   │   │   ├── shop/                       # Product shop page
│   │   │   │   ├── tools/                      # Electrical calculators page
│   │   │   │   ├── wishlist/                   # Wishlist page
│   │   │   │   ├── payment/                    # Payment success/fail pages
│   │   │   │   └── api/                        # 4 Next.js API route handlers (payment webhooks)
│   │   │   │       ├── auth/                   # [...nextauth], register, me, verify-email
│   │   │   │       ├── payments/               # initiate, sslcommerz/ipn, bkash/callback, nagad/callback
│   │   │   │       ├── admin/                  # 29 admin CRUD routes
│   │   │   │       ├── blog/                   # blog & blog/[slug]
│   │   │   │       ├── brands/, cart/, contact/, coupons/
│   │   │   │       ├── newsletter/, orders/, products/
│   │   │   │       ├── projects/, quote-requests/
│   │   │   │       ├── reviews/, services/, wishlist/
│   │   │   ├── components/
│   │   │   │   ├── epf/                        # 23 custom feature components
│   │   │   │   │   ├── AnnouncementBar.tsx     # Scrolling announcement ticker
│   │   │   │   │   ├── Header.tsx              # 2-row header with mega menu
│   │   │   │   │   ├── HeroBanner.tsx          # 3-slide hero carousel
│   │   │   │   │   ├── FlashDeals.tsx          # Countdown + product grid
│   │   │   │   │   ├── TrustBar.tsx            # Trust feature icons
│   │   │   │   │   ├── ServicesSection.tsx     # Service cards carousel
│   │   │   │   │   ├── ShopSection.tsx         # Product cards slider
│   │   │   │   │   ├── BrandStrip.tsx          # Auto-scrolling brands
│   │   │   │   │   ├── ProjectsSection.tsx     # Project cards slider
│   │   │   │   │   ├── ToolsSection.tsx        # 8 electrical calculators
│   │   │   │   │   ├── NewsletterBanner.tsx    # Email subscription CTA
│   │   │   │   │   ├── Footer.tsx              # 5-column footer
│   │   │   │   │   ├── CartDrawer.tsx          # Sheet-based cart drawer
│   │   │   │   │   ├── CheckoutDialog.tsx      # Full checkout form
│   │   │   │   │   ├── ServiceBookingDialog.tsx # Service booking form
│   │   │   │   │   ├── ProductDetailDialog.tsx # Product quick-view
│   │   │   │   │   ├── ProjectDetailDialog.tsx # Project detail view
│   │   │   │   │   ├── ChatWidget.tsx          # Floating AI chatbot
│   │   │   │   │   ├── NewsletterPopup.tsx     # Delayed popup
│   │   │   │   │   ├── AdminPanel.tsx          # Full admin dashboard (~2500 lines)
│   │   │   │   │   ├── HomeClient.tsx          # Client-side orchestrator
│   │   │   │   │   ├── BackToTopButton.tsx     # Scroll-to-top FAB
│   │   │   │   │   └── CategoryGrid.tsx        # Category icons grid
│   │   │   │   ├── ui/                         # 48 shadcn/ui components
│   │   │   │   └── providers.tsx               # SessionProvider + QueryClientProvider
│   │   │   ├── hooks/                          # Custom React hooks
│   │   │   │   ├── use-toast.ts
│   │   │   │   └── use-mobile.ts
│   │   │   ├── lib/                            # Utility libraries
│   │   │   │   ├── db.ts                       # Re-exports from @epowerfix/db
│   │   │   │   ├── auth-utils.ts               # JWT verification for payment routes
│   │   │   │   ├── auth-utils.ts               # Password hashing, JWT helpers
│   │   │   │   ├── payments.ts                 # SSLCommerz/bKash/Nagad integration
│   │   │   │   ├── rate-limit.ts               # In-memory rate limiter
│   │   │   │   ├── test-payment.ts             # Test payment token generator
│   │   │   │   └── utils.ts                    # cn(), generateSlug(), etc.
│   │   │   ├── store/                          # Zustand state stores
│   │   │   │   └── index.ts                    # useUIStore, useCartStore, useAuthStore
│   │   │   └── middleware.ts                   # Admin route protection
│   │   ├── public/                             # Static assets
│   │   ├── next.config.ts                      # Next.js config (standalone, security headers)
│   │   ├── tailwind.config.ts                  # Tailwind CSS theme config
│   │   └── package.json                        # @epowerfix/web
│   │
│   └── api/                                    # Express.js REST API
│       ├── src/
│       │   ├── server.ts                       # Express app entry point
│       │   ├── routes/                         # 16 public route files
│       │   │   ├── products.ts, services.ts, projects.ts, blog.ts
│       │   │   ├── brands.ts, cart.ts, orders.ts, wishlist.ts
│       │   │   ├── reviews.ts, coupons.ts, newsletter.ts
│       │   │   ├── contact.ts, quote-requests.ts, services-book.ts
│       │   │   └── admin/                      # 16 admin route files
│       │   │       ├── products.ts, services.ts, projects.ts, blog.ts
│       │   │       ├── orders.ts, users.ts, reviews.ts, brands.ts
│       │   │       ├── coupons.ts, stats.ts, bookings.ts
│       │   │       ├── quote-requests.ts, messages.ts, newsletter.ts
│       │   │       ├── product-categories.ts, service-categories.ts
│       │   ├── middleware/                      # Express middleware
│       │   │   ├── auth.ts                     # JWT auth middleware
│       │   │   ├── rate-limit.ts               # Rate limiting
│       │   │   └── validate.ts                 # Zod request validation
│       │   └── utils/                          # API utilities
│       │       ├── slug.ts                     # Slug generator
│       │       ├── response.ts                 # Standard response helpers
│       │       └── json-str.ts                 # JSON string parsers
│       └── package.json                        # @epowerfix/api
│
├── packages/
│   ├── db/                                     # @epowerfix/db — Shared Database
│   │   ├── prisma/
│   │   │   ├── schema.prisma                   # 17 database models
│   │   │   └── seed.ts                         # Comprehensive seed data (~61KB)
│   │   └── src/
│   │       └── index.ts                        # PrismaClient singleton export
│   │
│   └── types/                                  # @epowerfix/types — Shared Types
│       └── src/
│           └── index.ts                        # 10 enums + 28 interfaces
│
├── package.json                                # Root monorepo config
├── turbo.json                                  # Turborepo pipeline config
├── tsconfig.json                               # Root TypeScript config
├── .env.example                                # Environment variable template
├── Dockerfile                                  # Production Docker build
├── docker-compose.yml                          # Multi-service Docker Compose
└── .gitignore
```

---

## Database Schema

The database has **17 models** managed by Prisma ORM:

| Model | Description |
|---|---|
| **User** | Users with roles (customer, admin, super_admin) |
| **Brand** | Product brands (Siemens, Schneider, etc.) |
| **ServiceCategory** | Service categories (Wiring, Solar, Automation) |
| **Service** | Services with pricing (fixed, per-sqft, per-point, per-watt) |
| **ServiceBooking** | Customer service booking with date/time |
| **ProductCategory** | Product categories (Cables, Breakers, LED, etc.) |
| **Product** | Products with pricing, specs, stock, ratings |
| **CartItem** | Shopping cart (supports guest via sessionId) |
| **Order** | Orders with coupon, delivery fee, payment tracking |
| **OrderItem** | Individual items within an order |
| **Wishlist** | User wishlists |
| **Review** | Product reviews (1-5 rating) |
| **Coupon** | Discount coupons (percentage/fixed) |
| **QuoteRequest** | B2B quote requests |
| **BlogPost** | Blog posts with markdown content |
| **Newsletter** | Newsletter subscribers |
| **Project** | Showcase projects (electrical, solar, automation, IoT) |
| **ContactMessage** | Contact form messages |

**Current database:** SQLite (for development)
**Production database:** PostgreSQL 16

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.3+ (package manager & runtime)
- [Node.js](https://nodejs.org/) v20+ (for Next.js)
- PostgreSQL 16 (for production) or SQLite (for development)

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd epowerfix

# 2. Install all dependencies (installs for all workspaces)
bun install

# 3. Copy environment variables
cp .env.example .env
# Also copy for the API server:
cp .env.example apps/api/.env

# 4. Edit .env with your values (see Environment Variables section below)

# 5. Setup database
# For development (SQLite):
cd packages/db && bunx prisma db push && cd ../..

# For production (PostgreSQL):
# Update DATABASE_URL in .env to your PostgreSQL connection string
cd packages/db && bunx prisma db push && cd ../..

# 6. Generate Prisma client
cd packages/db && bunx prisma generate && cd ../..

# 7. Seed the database with sample data
bun run db:seed

# 8. Start development servers
bun run dev
```

This will start both:
- **Frontend:** http://localhost:3000
- **API Server:** http://localhost:4000

---

## Environment Variables

Copy `.env.example` and fill in the values:

```env
# ============ DATABASE ============
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/epowerfix
# For SQLite (development): DATABASE_URL=file:./custom.db

# ============ AUTH ============
AUTH_SECRET=your-super-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000

# ============ SSLCOMMERZ ============
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=

# ============ bKASH ============
BKASH_STORE_ID=
BKASH_STORE_PASSWORD=

# ============ NAGAD ============
NAGAD_MERCHANT_ID=
NAGAD_CHECKOUT_PRIVATE_KEY=

# ============ APP ============
NODE_ENV=development
```

**Note:** The app works without payment gateway credentials — it falls back to **test mode** with simulated payments.

---

## Development

### Available Commands (from root)

```bash
# Start everything (web + api)
bun run dev

# Start only the Next.js frontend
bun run dev:web

# Start only the Express API
bun run dev:api

# Build for production
bun run build

# Run linter
bun run lint

# Database commands
bun run db:push          # Push schema changes to database
bun run db:generate      # Generate Prisma client
bun run db:seed          # Seed sample data
bun run db:migrate       # Run migrations
```

### Individual Package Commands

```bash
# Web (apps/web)
cd apps/web
bun run dev       # Start Next.js dev server on port 3000
bun run build     # Production build
bun run lint      # ESLint

# API (apps/api)
cd apps/api
bun run dev       # Start Express with hot-reload on port 4000
bun run start     # Production start

# Database (packages/db)
cd packages/db
bun run db:push     # Push schema
bun run db:generate # Generate client
bun run db:seed     # Seed data
```

---

## API Overview

### API Architecture

The project uses a **single Express REST API** as the primary backend, with Next.js handling only payment webhooks:

1. **Express REST API** (`apps/api/src/`) — 31 route files, the primary API used by the frontend. Includes:
   - **Auth middleware** — JWT verification with role-based access (admin/super_admin)
   - **Rate limiting** — Per-IP rate limiting
   - **Request validation** — Zod schema validation
2. **Next.js Route Handlers** (`apps/web/src/app/api/`) — only 4 payment webhook routes (`payments/initiate`, `sslcommerz/ipn`, `bkash/callback`, `nagad/callback`) kept in Next.js so they can receive webhooks on the same domain.

The frontend talks to Express directly via `apps/web/src/lib/api.ts` (`NEXT_PUBLIC_API_URL`).

### Public Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/products` | GET | List products (with filters) |
| `/api/services` | GET | List services |
| `/api/services/book` | POST | Book a service |
| `/api/projects` | GET | List projects |
| `/api/blog` | GET | List blog posts |
| `/api/blog/[slug]` | GET | Get blog post by slug |
| `/api/brands` | GET | List brands |
| `/api/cart` | GET/POST | View/add to cart |
| `/api/cart/update` | PUT | Update cart item |
| `/api/cart/remove` | DELETE | Remove cart item |
| `/api/orders` | POST | Place order |
| `/api/wishlist` | GET/POST/DELETE | Manage wishlist |
| `/api/reviews` | GET/POST | Product reviews |
| `/api/coupons` | GET | Validate coupon code |
| `/api/newsletter` | POST | Subscribe to newsletter |
| `/api/contact` | POST | Send contact message |
| `/api/quote-requests` | POST | Submit quote request |
| `/api/auth/login` | POST | Login (sets JWT cookie) |
| `/api/auth/register` | POST | User registration |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/logout` | POST | Clear JWT cookie |
| `/api/payments/initiate` | POST | Initiate payment |
| `/api/payments/sslcommerz/ipn` | POST | SSLCommerz IPN callback |
| `/api/payments/bkash/callback` | POST | bKash callback |
| `/api/payments/nagad/callback` | POST | Nagad callback |

### Admin Endpoints (requires admin/super_admin role)

All admin endpoints are under `/api/admin/` and support full CRUD:

`products`, `services`, `projects`, `blog`, `orders`, `users`, `reviews`, `brands`, `coupons`, `bookings`, `quote-requests`, `messages`, `newsletter`, `product-categories`, `service-categories`, `stats`

---

## Payment Integrations

The app supports 4 payment methods:

| Method | Gateway | Status |
|---|---|---|
| **Cash on Delivery** | — | Always available |
| **bKash** | bKash PGW | Configurable (test/production) |
| **Nagad** | Nagad PGW | Configurable (test/production) |
| **SSLCommerz** | SSLCommerz PGW | Configurable (test/production) |

If payment gateway credentials are not set, the system automatically falls back to **test mode** with simulated one-time payment tokens.

---

## Admin Panel

The admin panel is a comprehensive dashboard built as a single React component (`AdminPanel.tsx`, ~2,500 lines) accessible at `/admin`.

### Features:
- **Dashboard** — Revenue chart (Recharts), order statistics, recent activities
- **Product CRUD** — Create/edit products with images, specs (JSON), categories, brands
- **Service CRUD** — Manage services with categories, pricing models, features
- **Order Management** — View/update order status and payment status
- **User Management** — View users, activate/deactivate, role assignment
- **Blog Management** — MDX editor for blog post creation/editing
- **Booking Management** — Approve/update service bookings
- **Coupon System** — Create discount codes with percentage/fixed type, limits
- **Brand Management** — Add/edit brands with logos
- **Quote Management** — Review and reply to B2B quote requests
- **Contact Inbox** — View and manage contact messages
- **Newsletter** — View subscriber list

### Default Admin Access:
The seed data creates a default admin user:
- **Email:** admin@epowerfix.com
- **Password:** admin123456

> Change this in production!

---

## Deployment

### Docker (Recommended)

```bash
# Build and start all services
docker-compose up -d

# This starts:
# - web (Next.js) on port 3000
# - api (Express) on port 4000
# - db (PostgreSQL) on port 5432
```

### Manual Production Build

```bash
# 1. Install dependencies
bun install

# 2. Setup database
cd packages/db
bunx prisma generate
bunx prisma db push
bun run prisma/seed.ts
cd ../..

# 3. Build the web app
cd apps/web
bun run build
cd ../..

# 4. Start production
cd apps/web
NODE_ENV=production bun .next/standalone/server.js
```

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name epowerfix.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Project Stats

| Metric | Count |
|---|---|
| TypeScript/TSX files | 225 |
| Total lines of code | ~33,000 |
| React pages | 15 |
| Custom components (epf/) | 23 |
| UI components (shadcn/ui) | 48 |
| Next.js API routes | 4 (payment webhooks only) |
| Express API routes | 31 |
| Prisma models | 17 |
| Shared TypeScript enums | 10 |
| Shared TypeScript interfaces | 28 |
| Zustand stores | 3 (UI, Cart, Auth) |
| Payment gateways | 3 (bKash, Nagad, SSLCommerz) |
| Electrical calculators | 8 |
| Languages | Bengali + English |

---

## License

Private — All rights reserved. (c) ePowerFix# ePowerFix-Web
