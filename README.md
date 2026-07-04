# ePowerFix — Admin Panel (Dynamic)

A complete e-commerce + service booking platform for electrical products in Bangladesh. This version has a **fully dynamic admin panel** — all CRUD operations work against a PostgreSQL database via Next.js API routes (no separate Express API server needed).

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript 5
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT (httpOnly cookies) via `jose`
- **UI:** Tailwind CSS 4 + shadcn/ui (New York)
- **State:** Zustand + TanStack Query
- **Deploy:** Vercel (app) + Neon (database)

## Quick Start (Local with PostgreSQL)

### 1. Prerequisites

- Node.js 18+ or Bun
- PostgreSQL 14+ running locally

### 2. Install dependencies

```bash
bun install
```

### 3. Create the database

```bash
psql -U postgres -c "CREATE DATABASE epowerfix;"
# OR
createdb -U postgres epowerfix
```

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — update the `DATABASE_URL` to match your local PostgreSQL:

```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/epowerfix?schema=public"
JWT_SECRET="any-long-random-string"
NEXTAUTH_SECRET="any-long-random-string"
```

### 5. Push schema & generate Prisma client

```bash
bun run db:push      # Creates all 33 tables in PostgreSQL
bun run db:generate  # Generates Prisma Client
```

### 6. Seed the database (creates admin user + sample data)

```bash
bun run prisma/seed.ts
```

This creates:
- 1 admin user: `admin@epowerfix.com` / `admin123`
- 3 customers, 6 products, 4 brands, 4 categories
- 3 sample orders, 3 services, 3 blog posts, 3 coupons, and more

### 7. Start the dev server

```bash
bun run dev
```

Open http://localhost:3000

### 8. Access the admin panel

- Go to http://localhost:3000/admin/login
- Login with `admin@epowerfix.com` / `admin123`

---

## 🚀 Deploy to Vercel (Free — Production)

### Step 1: Create a PostgreSQL database on Neon

1. Go to https://neon.tech and sign up (free)
2. Click "New Project" → name it `epowerfix`
3. Select a region close to you (e.g., Singapore for Bangladesh)
4. Copy the connection string — looks like:
   ```
   postgresql://neondb_owner:password@ep-xxx.us-east-2.aws.neon.tech/epowerfix?sslmode=require
   ```

### Step 2: Push schema to Neon database

From your local machine:

```bash
# Set the Neon DATABASE_URL temporarily
export DATABASE_URL="postgresql://neondb_owner:password@ep-xxx.neon.tech/epowerfix?sslmode=require"

# Push schema (creates 33 tables)
bun run db:push

# Seed data (creates admin user + sample data)
bun run prisma/seed.ts
```

### Step 3: Deploy to Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click "Add New" → "Project"
3. Import your `ePowerFix` repository
4. Vercel auto-detects Next.js — keep defaults
5. Add Environment Variables:
   ```
   DATABASE_URL    = postgresql://neondb_owner:password@ep-xxx.neon.tech/epowerfix?sslmode=require
   JWT_SECRET      = your-long-random-jwt-secret-min-32-chars
   NEXTAUTH_SECRET = your-long-random-nextauth-secret
   ```
6. Click "Deploy" — wait 2-3 minutes
7. Your site is live at `https://ePowerFix.vercel.app`!

### Step 4: Login to admin panel

- Visit `https://your-site.vercel.app/admin/login`
- Login with `admin@epowerfix.com` / `admin123`
- **⚠️ Change the admin password immediately** via the admin panel

---

## 🔐 Security Checklist (Before Going Live)

- [ ] **Change admin password** — edit `prisma/seed.ts`, re-run seed, or change via admin panel
- [ ] **Generate new JWT_SECRET** — run `openssl rand -base64 32`
- [ ] **Generate new NEXTAUTH_SECRET** — run `openssl rand -base64 32`
- [ ] **Review admin user list** — remove any test users
- [ ] **Set up rate limiting** — already included in security package
- [ ] **Enable Neon automated backups** — free tier includes 7 days
- [ ] **Add custom domain** — in Vercel dashboard → Settings → Domains

---

## Admin Panel Features

All admin features are **dynamic** (connected to PostgreSQL):

| Module | Features |
|--------|----------|
| Dashboard | Real stats, recent orders, top products |
| Orders | List, view detail, update status, delete |
| Products | Full CRUD, search, filter by category/brand/status |
| Categories | Full CRUD |
| Brands | Full CRUD |
| Services | Full CRUD |
| Service Categories | Full CRUD |
| Bookings | List, update status |
| Users/Customers | List, edit, activate/deactivate, delete |
| Staff | List admin users, add new staff |
| Coupons | Full CRUD, toggle active |
| Flash Sales | Full CRUD |
| Newsletter | List subscribers, delete |
| Banners | Full CRUD, toggle, reorder |
| Projects | Full CRUD (portfolio + sellable kits) |
| Blog | Full CRUD |
| Reviews | List, approve/reject |
| Messages | List, reply, delete |
| Quote Requests | List, update status, delete |
| Returns | List, update status |
| Taxes | Full CRUD |
| Settings | Site-wide settings |
| AI Providers | Full CRUD |
| Product Questions | Answer, delete |

## API Architecture

All API routes are Next.js App Router routes (no separate Express server):

```
src/app/api/
├── auth/             # login, me, logout
├── admin/            # 53 admin CRUD routes
│   ├── orders/       # GET, POST + [id] GET/PUT/DELETE + [id]/status PUT
│   ├── products/     # GET, POST + [id] GET/PUT/DELETE
│   ├── users/        # ...
│   └── ...           # (see src/app/api/admin/ for full list)
└── payments/         # Payment gateway callbacks (bKash, Nagad, SSLCommerz)
```

All admin routes are protected by `requireAdmin()` middleware (checks JWT + ADMIN role).

## Project Structure

```
prisma/
├── schema.prisma    # 33 models (PostgreSQL)
└── seed.ts          # Seeds admin + sample data

src/
├── app/
│   ├── admin/       # 26 admin pages
│   ├── api/         # 60 API routes
│   └── ...          # Public pages (shop, services, blog, etc.)
├── components/
│   ├── ui/          # shadcn/ui components
│   ├── epf/         # ePowerFix components
│   └── admin/       # Admin sidebar, AI chat
├── lib/
│   ├── auth.ts      # JWT session helpers
│   ├── admin-api.ts # Admin API helpers (pagination, JSON fields)
│   ├── db.ts        # Prisma client (re-exports from @epowerfix/db)
│   └── api.ts       # Frontend apiFetch helper
└── store/           # Zustand stores (auth, cart, ui, header)

packages/
├── db/              # Prisma client with soft-delete extension
├── types/           # Shared TypeScript types
├── config/          # Config (categories, delivery, constants)
├── utils/           # Utilities (slug, pagination, currency, response)
├── security/        # Security middleware
└── i18n/            # Internationalization (en/bn)
```

## Scripts

```bash
bun run dev          # Start dev server (port 3000)
bun run build        # Production build
bun run lint         # ESLint
bun run db:push      # Push schema to PostgreSQL
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Create migration
bun run db:reset     # Reset database
```

## Default Admin Credentials

```
Email:    admin@epowerfix.com
Password: admin123
```

**⚠️ Change these immediately in production** by editing `prisma/seed.ts` and re-running the seed, or via the admin panel.

## Future: Mobile App Migration

When you're ready to build a mobile app (React Native), the backend can be extracted into a separate Express API:

1. Move `src/app/api/**` routes → Express server
2. Update `src/lib/api.ts` to point to the new API URL
3. Both web + mobile will use the same API

The code is structured to make this migration straightforward when needed.
