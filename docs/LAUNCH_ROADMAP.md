# 🚀 ePowerFix — Complete Launch & Management Roadmap

> **Document Type:** Master execution plan for AI agents & team
> **Target:** Launch website + app, marketing, operations, AI automation
> **Context:** Bangladesh electrical services + e-commerce + student projects
> **Owner:** Founder (ePowerFix)
> **Last Updated:** 2026

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Model](#2-business-model)
3. [Technology Decision: Flutter vs React Native vs PWA](#3-technology-decision-flutter-vs-react-native-vs-pwa)
4. [Current State Assessment](#4-current-state-assessment)
5. [Architecture & Tech Stack](#5-architecture--tech-stack)
6. [Phase-by-Phase Execution Plan](#6-phase-by-phase-execution-plan)
7. [Product Management](#7-product-management)
8. [Project & Service Management](#8-project--service-management)
9. [Marketing Strategy (Bangladesh)](#9-marketing-strategy-bangladesh)
10. [Operations & Team](#10-operations--team)
11. [AI Integration Plan](#11-ai-integration-plan)
12. [Budget & KPIs](#12-budget--kpis)
13. [Agent Task Checklist](#13-agent-task-checklist)

---

## 1. Executive Summary

**ePowerFix** is a multi-vertical electrical business platform targeting the Bangladesh market with 4 customer segments:

| Segment | Need | Revenue Potential |
|---------|------|-------------------|
| 🏠 Households/Offices | Local wiring, repair, installation services | High (recurring) |
| 🏗️ Builders/Developers | Bulk electrical contracts for new buildings | Very High (B2B) |
| 🛒 Retailers/Wholesalers | Bulk electrical products at wholesale price | High (volume) |
| 🎓 Students (BUET/KUET/Polytechnic) | Electrical projects, project kits for practical exams | Medium (high frequency) |

**Goal:** Launch the website + mobile app together, build a brand, and scale to a full electrical ecosystem in Bangladesh.

**Core Strategy:**
- Phase 1: Polish existing Next.js website → Soft launch (Weeks 1-3)
- Phase 2: Add PWA support → "App" available without native dev (Weeks 4-5)
- Phase 3: Aggressive marketing across Facebook, YouTube, TikTok, Campus (Weeks 5+)
- Phase 4: Build React Native (Expo) native app IF user base justifies (Month 4+)
- Throughout: AI automation for support, content, analytics

---

## 2. Business Model

### 2.1 Revenue Streams

```
ePowerFix Revenue Model
├── Services (High Margin, Recurring)
│   ├── House wiring (new installation)
│   ├── Repair & maintenance
│   ├── Industrial/commercial installation
│   ├── Emergency service (premium pricing)
│   └── Annual maintenance contracts (AMC)
│
├── Products (Volume-based)
│   ├── Retail (B2C) — 20-30% margin
│   ├── Wholesale (B2B) — 10-15% margin, bulk orders
│   └── Flash sales / promotions
│
├── Projects (High Margin, Niche)
│   ├── Student projects (100-5,000 ৳)
│   ├── Project kits (500-3,000 ৳)
│   ├── Custom projects (10,000+ ৳)
│   └── Real-world installation projects (50,000+ ৳)
│
└── Contracts (B2B, Long-term)
    ├── Builder company partnerships
    ├── University lab supply
    └── Corporate AMC
```

### 2.2 Pricing Strategy

| Tier | Markup | Min Order |
|------|--------|-----------|
| Retail | +25-30% on supplier price | 1 unit |
| Wholesale | +10-15% on supplier price | 10 units |
| Bulk (B2B contract) | +5-8% on supplier price | 100+ units |
| Service | Labor + 15% on materials | — |
| Student project | Cost + 40-50% (knowledge premium) | — |

---

## 3. Technology Decision: Flutter vs React Native vs PWA

> **This is the most critical decision. Read carefully.**

### 3.1 Comparison Matrix

| Criteria | PWA (Next.js) | React Native (Expo) | Flutter |
|----------|--------------|---------------------|---------|
| **Existing code reuse** | ✅ 100% (already built) | ✅ 70% (API, types, utils) | ❌ 0% (Dart rewrite) |
| **SEO for products** | ✅ Excellent (SSR) | ❌ None | ⚠️ Poor (web) |
| **App store presence** | ❌ No | ✅ Yes (iOS + Android) | ✅ Yes (iOS + Android) |
| **Native features** (camera, push) | ⚠️ Limited | ✅ Full | ✅ Full |
| **Performance** | ⚠️ Web-tier | ✅ Near-native | ✅ Native-tier |
| **Single codebase web+mobile** | ✅ Yes | ❌ Need Next.js for web | ✅ Yes (but web weak) |
| **Team skill match** | ✅ TypeScript | ✅ TypeScript | ❌ Dart (new) |
| **Time to market** | ✅ 1 week | ⚠️ 1-2 months | ❌ 3+ months |
| **Cost (initial)** | ✅ Lowest | ⚠️ Medium | ❌ High |
| **Bangladesh user behavior** | ⚠️ Mobile browser ok | ✅ Apps preferred | ✅ Apps preferred |

### 3.2 🏆 RECOMMENDATION: Hybrid Approach

**Do NOT choose just one. Use a phased hybrid:**

```
Month 1-2: PWA (Next.js)
   ↓
   - Immediate app-like experience
   - Installable on phone home screen
   - Push notifications via Firebase
   - Offline support for product catalog
   - Zero additional codebase
   ↓
Month 3-4: Evaluate user base
   ↓
   IF 5,000+ active users → Build React Native (Expo) app
   - Reuse API client, types, business logic from Next.js
   - Submit to Play Store + App Store
   - PWA remains as web fallback
   ↓
DO NOT use Flutter because:
   ❌ Complete rewrite of existing Next.js investment
   ❌ Dart is a new language for the team
   ❌ Flutter web has poor SEO (kills product discoverability)
   ❌ No reuse of existing 200+ files in /src
```

### 3.3 Why React Native (Expo) over Flutter (if native app needed later)?

1. **Language reuse:** Your Next.js code is TypeScript. React Native is also TypeScript → team productivity stays high.
2. **Code sharing:** API client (`/src/lib/api.ts`), types, payment logic, auth flows can be shared via a monorepo.
3. **Expo magic:** No Xcode/Android Studio setup needed. `eas build` handles everything.
4. **Ecosystem:** 90% of npm packages work in React Native.
5. **Hiring:** More React developers in Bangladesh than Flutter.
6. **Hot reload:** Faster development cycle.

### 3.4 Final Tech Decision Summary

| Layer | Technology | Status |
|-------|-----------|--------|
| Website (web) | **Next.js 16** (existing) | ✅ Keep & enhance |
| App (mobile, Phase 1) | **PWA on Next.js** | 🔨 To add |
| App (mobile, Phase 2) | **React Native + Expo** | 📋 Future (Month 4+) |
| Backend API | **Next.js API Routes** (existing) | ✅ Keep |
| Database | **PostgreSQL + Prisma** | ✅ Keep |
| Payments | bKash, Nagad, SSLCommerz | ✅ Already integrated |
| AI | z-ai-web-dev-sdk | ✅ Already integrated |

---

## 4. Current State Assessment

### 4.1 What's Already Built ✅

The repository at `/home/z/ePowerFix` contains a **mature Next.js 16 application** with:

**Storefront (Customer-facing):**
- Home page, Shop, Product detail, Cart, Checkout
- Wishlist, Compare, Order tracking
- Service booking, Project kits, Projects portfolio
- Cost estimator, Get quote, Contact
- User auth (login/register/profile)
- Payment success/fail pages

**Admin Panel (30+ sections):**
- Dashboard, Products, Categories, Brands, Orders
- Services, Service categories, Bookings
- Project kits, Projects, Blog, Banners
- Coupons, Flash sales, Taxes, Shipping
- Users, Staff, Reviews, Returns
- Newsletter, Messages, Quote requests
- AI agent, AI providers, Security, Settings
- Media library, Product questions

**API Layer:**
- Full REST API for all entities
- Auth (NextAuth.js v5)
- Payment webhooks (bKash, Nagad, SSLCommerz)
- Admin endpoints with role-based access
- AI agent endpoint
- Security (rate limit, IP rules, audit logs)

**Infrastructure:**
- Prisma ORM with PostgreSQL
- Upstash Redis (caching)
- Sentry (error tracking)
- Cloud storage (Cloudinary ready)
- Next-themes (dark mode)
- next-intl (i18n ready)

### 4.2 What Needs To Be Done Before Launch

| Priority | Task | Effort |
|----------|------|--------|
| 🔴 Critical | Database setup + `prisma db push` | 1 day |
| 🔴 Critical | Environment variables (`.env`) | 1 day |
| 🔴 Critical | Payment gateway credentials (bKash/Nagad/SSL) | 3-5 days (bank process) |
| 🔴 Critical | Seed data (50+ products, 6+ services, 10+ project kits) | 3-5 days |
| 🟡 High | PWA manifest + service worker | 1-2 days |
| 🟡 High | Domain + hosting (Vercel/DigitalOcean) | 1 day |
| 🟡 High | SEO audit (sitemap, robots, OG images) | 1 day |
| 🟢 Medium | AI agent training (product knowledge) | 2-3 days |
| 🟢 Medium | Logo + branding polish | 2-3 days |
| 🟢 Medium | Legal pages (privacy, terms, refund) | 1 day |

---

## 5. Architecture & Tech Stack

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER DEVICES                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Web (PWA) │  │ Mobile App │  │  Admin Web │            │
│  │ Next.js    │  │ React Nav  │  │ Next.js    │            │
│  │ (existing) │  │ (future)   │  │ /admin     │            │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘            │
└────────┼───────────────┼───────────────┼────────────────────┘
         │               │               │
         └───────────────┼───────────────┘
                         │ HTTPS
                  ┌──────▼──────┐
                  │   Caddy     │  (Gateway/SSL)
                  │  Reverse    │
                  │   Proxy     │
                  └──────┬──────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
  ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
  │ Next.js API │ │ AI Service  │ │  WebSocket │
  │  (port 3000)│ │(z-ai-sdk)   │ │  Service   │
  │             │ │             │ │ (port 3003)│
  └──────┬──────┘ └──────┬──────┘ └────────────┘
         │               │
         │               │
  ┌──────▼──────┐ ┌──────▼──────┐
  │ PostgreSQL  │ │  Upstash    │
  │  (Prisma)   │ │   Redis     │
  └─────────────┘ └─────────────┘

External Services:
  - bKash / Nagad / SSLCommerz (Payments)
  - Cloudinary (Image storage)
  - Firebase Cloud Messaging (Push notifications)
  - Sentry (Error monitoring)
  - Pathao / RedX / Steadfast (Delivery)
```

### 5.2 Tech Stack (Final)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS + shadcn/ui | 4.x |
| Database | PostgreSQL + Prisma | 6.x |
| Auth | NextAuth.js | 5.x beta |
| State | Zustand + TanStack Query | latest |
| Payments | bKash, Nagad, SSLCommerz | — |
| Caching | Upstash Redis | — |
| AI | z-ai-web-dev-sdk | 0.0.18 |
| Mobile (future) | React Native + Expo | latest |
| Hosting | Vercel / DigitalOcean | — |
| Domain | .com.bd (Bangladesh trust) | — |

---

## 6. Phase-by-Phase Execution Plan

### 📅 Phase 1: Polish & Soft Launch (Weeks 1-3)

**Goal:** Get website production-ready and launch to small audience.

#### Week 1: Infrastructure Setup

- [ ] **T1.1** Run `bun install` to install all dependencies
- [ ] **T1.2** Configure `.env` file (copy from `.env.example`):
  ```
  DATABASE_URL=postgresql://...
  NEXTAUTH_SECRET=<random-32-char>
  SSLCOMMERZ_STORE_ID=...
  SSLCOMMERZ_STORE_PASSWD=...
  BKASH_APP_KEY=...
  BKASH_APP_SECRET=...
  BKASH_USERNAME=...
  BKASH_PASSWORD=...
  NAGAD_MERCHANT_ID=...
  UPSTASH_REDIS_REST_URL=...
  UPSTASH_REDIS_REST_TOKEN=...
  CLOUDINARY_URL=...
  SENTRY_DSN=...
  ```
- [ ] **T1.3** Run `bun run db:push` to apply Prisma schema
- [ ] **T1.4** Run `bun run db:seed` to populate initial data
- [ ] **T1.5** Start dev server: `bun run dev` (verify no errors on `localhost:3000`)
- [ ] **T1.6** Run `bun run lint` — fix all errors

#### Week 2: Content & Data Entry

- [ ] **T2.1** Add 50+ products via `/admin/products` (wire, switch, bulb, MCB, board, socket, fan, etc.)
- [ ] **T2.2** Add 6+ services via `/admin/services` (house wiring, repair, installation, upgrade, inspection, emergency)
- [ ] **T2.3** Add 10+ project kits via `/admin/project-kits` (Arduino, IoT, Solar, Home Automation, etc.)
- [ ] **T2.4** Add 3-5 portfolio projects via `/admin/projects`
- [ ] **T2.5** Add 3-5 blog posts (SEO content) via `/admin/blog`
- [ ] **T2.6** Configure banners via `/admin/banners` (homepage hero, deals)
- [ ] **T2.7** Configure site settings (name, logo, contact, social links) via `/admin/settings`

#### Week 3: Payment Testing & Soft Launch

- [ ] **T3.1** Test bKash sandbox payment end-to-end
- [ ] **T3.2** Test Nagad sandbox payment end-to-end
- [ ] **T3.3** Test SSLCommerz sandbox payment end-to-end
- [ ] **T3.4** Test order placement, confirmation, tracking
- [ ] **T3.5** Test service booking flow
- [ ] **T3.6** Test admin order management
- [ ] **T3.7** Deploy to Vercel (or chosen host)
- [ ] **T3.8** Point domain (e.g., `epowerfix.com.bd`) to deployment
- [ ] **T3.9** Configure SSL (Caddy or Vercel auto)
- [ ] **T3.10** Soft launch announcement on Facebook page only

---

### 📅 Phase 2: PWA Setup (Weeks 4-5)

**Goal:** Make website installable as an app on mobile.

- [ ] **T4.1** Install PWA package: `bun add @ducanh2912/next-pwa`
- [ ] **T4.2** Configure `next.config.ts` with PWA plugin
- [ ] **T4.3** Create `public/manifest.json`:
  ```json
  {
    "name": "ePowerFix",
    "short_name": "ePowerFix",
    "description": "Electrical services, products & projects in Bangladesh",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#ffffff",
    "theme_color": "#f59e0b",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```
- [ ] **T4.4** Generate app icons (192px, 512px) using Image-Generation skill
- [ ] **T4.5** Add manifest link in `src/app/layout.tsx`
- [ ] **T4.6** Set up Firebase Cloud Messaging for push notifications
- [ ] **T4.7** Create service worker for offline product catalog
- [ ] **T4.8** Add "Install App" banner component (smart prompt)
- [ ] **T4.9** Test on Android Chrome + iOS Safari
- [ ] **T4.10** Promote PWA on Facebook: "Install our app from browser!"

---

### 📅 Phase 3: Marketing Launch (Weeks 5-8)

**Goal:** Drive traffic and first 100 paying customers.

#### 3.1 Facebook Marketing

- [ ] **T5.1** Create/verify Facebook Page: `ePowerFix`
- [ ] **T5.2** Create Facebook Group: "Electrical Projects BD — Students & Engineers"
- [ ] **T5.3** Set up Facebook Pixel (for retargeting)
- [ ] **T5.4** Run first FB Ad campaign — ₹5,000 budget:
  - Audience 1: Local 5km radius, age 25-55 (services)
  - Audience 2: BUET/KUET/Polytechnic students (projects)
- [ ] **T5.5** Post daily: 1 product highlight, 1 tip, 1 service showcase, 1 customer review
- [ ] **T5.6** Set up Facebook Messenger bot (link to AI agent)

#### 3.2 YouTube Channel

- [ ] **T6.1** Create YouTube channel: `ePowerFix BD`
- [ ] **T6.2** Upload channel art + intro video
- [ ] **T6.3** Publish 4 videos (1/week):
  - "How to install a ceiling fan at home"
  - "Arduino home automation project (beginner)"
  - "Polytechnic 3rd year practical project demo"
  - "How circuit breakers work"
- [ ] **T6.4** Add video links to relevant product pages (boosts conversion)
- [ ] **T6.5** Use TTS skill for voiceover if needed

#### 3.3 TikTok

- [ ] **T7.1** Create TikTok account
- [ ] **T7.2** Post 3 short videos/week (15-30s tips, demos)
- [ ] **T7.3** Cross-post YouTube Shorts

#### 3.4 Campus Ambassador Program

- [ ] **T8.1** Create ambassador program document (commission, responsibilities)
- [ ] **T8.2** Recruit 5 ambassadors (1 each: BUET, KUET, CUET, RUET, 1 Polytechnic)
- [ ] **T8.3** Give each ambassador: 10% commission code + free project guide
- [ ] **T8.4** Build ambassador tracking page in admin (new feature needed)
- [ ] **T8.5** Weekly check-in with ambassadors

#### 3.5 B2B Outreach

- [ ] **T9.1** Build list of 20 builder companies in Dhaka/Chittagong
- [ ] **T9.2** Prepare B2B proposal PDF (portfolio, pricing, terms)
- [ ] **T9.3** Cold call + visit 5 companies/week
- [ ] **T9.4** Negotiate first bulk contract

#### 3.6 WhatsApp Business

- [ ] **T10.1** Set up WhatsApp Business account
- [ ] **T10.2** Upload full product catalog
- [ ] **T10.3** Add WhatsApp click-to-chat button on website (ChatWidget exists)
- [ ] **T10.4** Create quick-reply templates

---

### 📅 Phase 4: Native App (Month 4+) — CONDITIONAL

**Trigger:** Only if PWA reaches 5,000+ active users OR 100+ daily orders.

- [ ] **T11.1** Set up Expo project: `npx create-expo-app epowerfix-app`
- [ ] **T11.2** Configure monorepo (Turborepo) to share code with Next.js:
  ```
  /packages
    /api-client      ← shared API logic
    /types           ← shared TypeScript types
    /utils           ← shared utilities
    /ui              ← shared UI primitives
  /apps
    /web             ← Next.js (existing)
    /mobile          ← Expo (new)
  ```
- [ ] **T11.3** Migrate `/src/lib/api.ts`, `/src/lib/types.ts` to shared packages
- [ ] **T11.4** Build mobile screens:
  - Auth (login/register)
  - Home (banners, categories, featured products)
  - Shop (product list, filters)
  - Product detail
  - Cart & checkout
  - Order tracking
  - Service booking
  - Project kits
  - Profile
- [ ] **T11.5** Integrate bKash/Nagad/SSL native SDKs
- [ ] **T11.6** Configure push notifications (FCM)
- [ ] **T11.7** Build & submit to Play Store: `eas build --platform android`
- [ ] **T11.8** Build & submit to App Store: `eas build --platform ios`
- [ ] **T11.9** App Store Optimization (ASO) — title, keywords, screenshots

---

## 7. Product Management

### 7.1 Inventory System

Use the existing admin panel at `/admin/products`:

**For each product, track:**
- SKU (unique code, e.g., `WIRE-2.5MM-RED`)
- Name (English + Bengali)
- Category & subcategory
- Brand
- Supplier
- Cost price (purchase price)
- Retail price (B2C)
- Wholesale price (B2B, 10+ units)
- Bulk price (B2B contract, 100+ units)
- Stock quantity
- Low stock threshold (alert at 10 units)
- Images (min 3 angles)
- Specifications
- Warranty info

### 7.2 Supplier Management

**Maintain a supplier database (spreadsheet or admin extension):**

| Supplier | Location | Products | Lead Time | Credit Terms | Phone |
|----------|----------|----------|-----------|--------------|-------|
| Supplier A | Nawabpur | Wire, cable | 2 days | 15 days credit | 01XXX |
| Supplier B | Chawkbazar | Switches, sockets | 1 day | Cash | 01XXX |
| Supplier C | Nawabpur | MCB, breaker | 3 days | 30 days credit | 01XXX |

**Rules:**
- Always have 2 suppliers per critical product category (backup)
- Negotiate 15-30 day credit terms (improves cash flow)
- Quarterly price review

### 7.3 Stock Replenishment Workflow

```
Stock drops below threshold
        ↓
Admin gets notification (existing /api/notifications)
        ↓
Check supplier price list
        ↓
Place purchase order (PO)
        ↓
Receive goods → update stock in admin
        ↓
Update cost price if changed
        ↓
Auto-recalculate retail/wholesale price
```

### 7.4 Pricing Rules (Auto-calculate)

```
retail_price = supplier_price × 1.30  (30% markup)
wholesale_price = supplier_price × 1.15 (10+ units)
bulk_price = supplier_price × 1.08 (100+ units)
flash_sale_price = retail_price × 0.85 (15% off)
```

---

## 8. Project & Service Management

### 8.1 Project Categories

| Category | Price Range | Target | Delivery |
|----------|-------------|--------|----------|
| Student Project (ready-made) | 100-5,000 ৳ | Polytechnic/Uni students | 1-3 days |
| Project kit (DIY) | 500-3,000 ৳ | Self-learners | 1-2 days |
| Custom student project | 1,000-15,000 ৳ | Final year students | 7-14 days |
| Real-world installation | 10,000-500,000 ৳ | Homes/offices | Per scope |
| Industrial project | 50,000+ ৳ | Factories | Per contract |

### 8.2 Project Delivery Checklist

**For every project sold:**
- [ ] Working demo video (uploaded to YouTube, linked in product)
- [ ] Circuit diagram (PDF)
- [ ] Source code (if Arduino/IoT) — GitHub repo or zip
- [ ] Component list / BOM
- [ ] Step-by-step assembly guide
- [ ] Support hotline (WhatsApp)
- [ ] 7-day support guarantee

### 8.3 Custom Project Workflow

```
Student submits request via /get-quote
        ↓
Admin reviews request (/admin/quote-requests)
        ↓
AI generates cost estimate (parts + labor + margin)
        ↓
Send quote to student (email + WhatsApp)
        ↓
Student accepts → pays 50% advance
        ↓
Project built (7-14 days)
        ↓
Demo video recorded → sent to student
        ↓
Student pays remaining 50%
        ↓
Project shipped / picked up
        ↓
Follow-up after 3 days (review request)
```

### 8.4 Service Management

**Service booking flow (already exists in app):**

```
Customer visits /services
        ↓
Selects service (e.g., house wiring)
        ↓
Books via /book-service/[id]
        ↓
Admin gets booking (/admin/bookings)
        ↓
Assign technician
        ↓
Technician visits → diagnoses → quotes
        ↓
Customer approves → work done
        ↓
Invoice generated → payment
        ↓
Follow-up after 7 days (maintenance reminder)
```

**Service pricing:**
- Visit/inspection fee: 200-500 ৳ (adjustable against final bill)
- Labor: 500-1,500 ৳/hour depending on complexity
- Materials: at cost + 15%
- Emergency (after hours): +50% premium
- AMC (annual): 12-month contract, monthly visits, 5,000-15,000 ৳/month

---

## 9. Marketing Strategy (Bangladesh)

### 9.1 Channel Priority Matrix

| Channel | Priority | Cost | Reach | Conversion | Best For |
|---------|---------|------|-------|------------|----------|
| Facebook | 🔴 Critical | Low-Med | Very High | High | All segments |
| YouTube | 🔴 Critical | Med | High | Med-High | Trust building, students |
| WhatsApp | 🔴 Critical | Free | Targeted | Very High | Closing sales |
| TikTok | 🟡 High | Low | Very High | Low-Med | Brand awareness, students |
| Campus ambassadors | 🟡 High | Commission | Targeted | Very High | Student projects |
| B2B direct sales | 🟡 High | Time | Low | Very High | Bulk contracts |
| Google Ads | 🟢 Medium | Med | Med | High | High-intent buyers |
| Instagram | 🟢 Low | Low | Med | Low | Visual showcase |
| LinkedIn | 🟢 Low | Free | Low | Med-High | B2B credibility |

### 9.2 Content Calendar (Weekly Template)

| Day | Facebook | YouTube | TikTok |
|-----|----------|---------|--------|
| Mon | Product highlight | — | Quick tip (15s) |
| Tue | Customer review | — | Project demo (30s) |
| Wed | Service showcase | — | — |
| Thu | Electrical tip | Long video (5-10 min) | Quick tip (15s) |
| Fri | Flash sale / promo | — | Project demo (30s) |
| Sat | Behind the scenes | — | Safety tip (15s) |
| Sun | Blog post share | — | — |

### 9.3 Facebook Ad Targeting (Specific Audiences)

**Audience 1: Home services**
- Location: 5-10km radius of office
- Age: 28-55
- Interests: Home improvement, real estate, interior design
- Budget: 3,000 ৳/week
- Goal: Service bookings

**Audience 2: Student projects**
- Location: University areas (BUET, KUET, CUET, RUET, Polytechnics)
- Age: 18-25
- Interests: Engineering, Arduino, electronics, robotics
- Budget: 2,000 ৳/week
- Goal: Project kit sales

**Audience 3: Wholesale buyers**
- Location: Electrical markets (Nawabpur, Chawkbazar)
- Interests: Wholesale, business, electrical
- Budget: 1,500 ৳/week
- Goal: Bulk orders

**Audience 4: Retargeting**
- People who visited website but didn't buy
- Budget: 1,500 ৳/week
- Goal: Conversion recovery

### 9.4 Referral Program

- Existing customer refers a friend → both get 5% discount
- Track via referral code in user profile
- Feature needed: Add referral code field to user model

### 9.5 SEO Strategy

- Target keywords (Bangladesh):
  - "electrical service Dhaka"
  - "house wiring Bangladesh"
  - "electrical project buy Bangladesh"
  - "Arduino project kit Bangladesh"
  - "wholesale electrical products BD"
- Publish 2 blog posts/week (use AI to write, human to edit)
- Optimize product pages with keywords in title, description, H1
- Build backlinks from electrical forums, university groups

---

## 10. Operations & Team

### 10.1 Team Structure (Lean Startup)

**Phase 1 (Months 1-3): 3 people**

| Role | Who | Salary | Responsibilities |
|------|-----|--------|------------------|
| Founder/CEO | You | — | Strategy, B2B sales, finance, oversight |
| Technician | Hire 1 | 15,000-20,000 ৳ | Service execution, project assembly |
| Customer support + operations | Hire 1 | 12,000-15,000 ৳ | Orders, chat, packing, dispatch |

**Phase 2 (Months 4-6): Add 2 people**

| Role | Salary | Responsibilities |
|------|--------|------------------|
| Digital marketer (part-time) | 8,000-12,000 ৳ | FB/YouTube/TikTok content |
| Delivery/packing assistant | 10,000-12,000 ৳ | Inventory, packing, local delivery |

**Phase 3 (Months 7-12): Scale as needed**

- More technicians (as service demand grows)
- Field sales rep (for B2B)
- Full-time content creator (if YouTube takes off)

### 10.2 Daily Operations Checklist

**Morning (9 AM):**
- [ ] Check overnight orders & messages
- [ ] Process pending orders
- [ ] Check low-stock alerts
- [ ] Post morning Facebook update

**Afternoon (1 PM):**
- [ ] Dispatch orders to courier
- [ ] Follow up on service bookings
- [ ] Reply to customer chats/WhatsApp
- [ ] Check AI chatbot transcripts (improve if needed)

**Evening (6 PM):**
- [ ] Reconcile payments (bKash/Nagad/bank)
- [ ] Update inventory in admin
- [ ] Plan tomorrow's content
- [ ] Post evening social update

### 10.3 Customer Support Workflow

```
Customer query (chat/WhatsApp/phone)
        ↓
AI chatbot answers (instant, 24/7)
        ↓
If complex → route to human agent
        ↓
Agent responds within 30 min (business hours)
        ↓
Resolve issue → log in admin
        ↓
Follow-up after 24h (satisfaction check)
```

### 10.4 Delivery Management

| Zone | Method | Cost | Time |
|------|--------|------|------|
| Inside Dhaka (own delivery) | Own rider | 50-80 ৳ | Same/next day |
| Dhaka suburbs | Pathao/RedX | 80-120 ৳ | 1-2 days |
| Outside Dhaka | Pathao/RedX/Steadfast | 100-150 ৳ | 2-4 days |
| Wholesale bulk | Courier/transport | Negotiable | 3-7 days |
| Service visit | Own technician | Free (if within 10km) | Per schedule |

---

## 11. AI Integration Plan

### 11.1 AI Capabilities Already Available

The project uses `z-ai-web-dev-sdk` with these skills:

| Skill | Use Case | Status |
|-------|----------|--------|
| **LLM** | Chatbot, content generation, customer support | ✅ Available |
| **VLM** | Image understanding (product photo analysis) | ✅ Available |
| **Image Generation** | Marketing images, product thumbnails | ✅ Available |
| **TTS** | Voiceover for YouTube videos | ✅ Available |
| **ASR** | Voice-to-text (future: voice search) | ✅ Available |
| **Web Search** | Competitor price monitoring, trends | ✅ Available |
| **Web Reader** | Scrape supplier price lists | ✅ Available |

### 11.2 AI Use Cases for ePowerFix

#### Use Case 1: 24/7 Customer Support Chatbot
**Where:** `ChatWidget.tsx` + `/api/ai/agent`
**How:**
- Feed product catalog, services, FAQs into AI context
- AI answers: product info, price, stock, service booking help
- Routes to human when confidence low
**Saves:** 1 full-time support staff

#### Use Case 2: Content Generation (Marketing)
**Where:** Admin → AI Agent page
**How:**
- Generate Facebook post captions (daily)
- Write product descriptions (bulk)
- Write SEO blog posts (weekly)
- Create ad copy variations
**Saves:** 10+ hours/week of content writing

#### Use Case 3: Product Image Generation
**Where:** Admin → Media → AI generate
**How:**
- Generate lifestyle images (product in use)
- Create promotional banners
- Generate social media graphics
**Saves:** Design outsourcing costs

#### Use Case 4: Video Voiceover (TTS)
**Where:** Offline / batch process
**How:**
- Write script → AI generates voiceover
- Use in YouTube videos
- Bengali voice preferred for local audience
**Saves:** Voice artist hiring

#### Use Case 5: Competitor Price Monitoring
**Where:** Scheduled cron job
**How:**
- Weekly: Web-search for competitor prices (Daraz, Othoba, local shops)
- Web-reader to extract prices
- AI compares and suggests price adjustments
**Saves:** Manual market research

#### Use Case 6: Demand Forecasting
**Where:** Admin dashboard
**How:**
- Analyze last 3 months of sales data
- AI predicts next month's demand per product
- Auto-generates restock recommendations
**Saves:** Stock-out losses, overstock

#### Use Case 7: Review Analysis
**Where:** Admin → Reviews
**How:**
- AI analyzes all customer reviews
- Identifies common complaints / praises
- Suggests product/service improvements
**Saves:** Manual review reading

#### Use Case 8: Quote Generation
**Where:** `/admin/quote-requests`
**How:**
- Student submits custom project request
- AI estimates: parts needed, labor hours, cost
- Auto-generates quote for admin approval
**Saves:** Engineering time per quote

### 11.3 AI Setup Checklist

- [ ] **AI.1** Configure z-ai-web-dev-sdk API key in `.env`
- [ ] **AI.2** Visit `/admin/ai-providers` — add provider credentials
- [ ] **AI.3** Visit `/admin/ai-agent` — configure system prompt with business context
- [ ] **AI.4** Feed product catalog as AI context (auto-updated)
- [ ] **AI.5** Train AI on common FAQ (return policy, warranty, delivery)
- [ ] **AI.6** Set up weekly cron for competitor price monitoring
- [ ] **AI.7** Set up weekly AI content generation (FB posts, blog drafts)
- [ ] **AI.8** Monitor AI chatbot transcripts weekly, improve prompts

---

## 12. Budget & KPIs

### 12.1 Initial Investment (First 3 Months)

| Item | Cost (৳) |
|------|---------|
| Domain (.com.bd, 1 year) | 2,000 |
| Hosting (Vercel Pro / DO, 3 months) | 3,000-9,000 |
| Cloudinary (free tier) | 0 |
| Upstash Redis (free tier) | 0 |
| Payment gateway setup (free, % per tx) | 0 |
| Logo + branding (if outsourced) | 5,000-10,000 |
| Initial inventory (50 products × avg 500 ৳) | 25,000 |
| Project kit inventory (10 kits × avg 1,000 ৳) | 10,000 |
| Tools/equipment (technician) | 15,000 |
| Marketing (3 months) | 45,000-66,000 |
| Salaries (3 people × 3 months) | 1,50,000-2,10,000 |
| Misc/contingency | 20,000 |
| **TOTAL** | **2,75,000 - 3,67,000 ৳** |

### 12.2 Monthly Operating Cost (Steady State)

| Item | Cost (৳/month) |
|------|---------------|
| Salaries (3-5 people) | 50,000-1,00,000 |
| Hosting | 1,000-3,000 |
| Marketing | 15,000-22,000 |
| Inventory restock (variable) | 50,000-1,50,000 |
| Delivery (variable) | 5,000-15,000 |
| Utilities/office | 8,000-15,000 |
| **TOTAL** | **1,30,000 - 3,05,000 ৳/month** |

### 12.3 Revenue Projections (Conservative)

| Month | Orders | Avg Order | Revenue | Profit (15%) |
|-------|--------|-----------|---------|--------------|
| 1 | 30 | 2,000 ৳ | 60,000 ৳ | 9,000 ৳ |
| 2 | 75 | 2,200 ৳ | 1,65,000 ৳ | 24,750 ৳ |
| 3 | 150 | 2,500 ৳ | 3,75,000 ৳ | 56,250 ৳ |
| 6 | 400 | 3,000 ৳ | 12,00,000 ৳ | 1,80,000 ৳ |
| 12 | 800 | 3,500 ৳ | 28,00,000 ৳ | 4,20,000 ৳ |

### 12.4 KPIs to Track

**Monthly review these metrics (track in admin dashboard):**

| KPI | Target (Month 3) | Target (Month 6) |
|-----|------------------|------------------|
| Monthly orders | 150 | 400 |
| Avg order value | 2,500 ৳ | 3,000 ৳ |
| Website visitors | 10,000 | 30,000 |
| Conversion rate | 1.5% | 2.5% |
| PWA installs | 500 | 3,000 |
| Facebook followers | 5,000 | 20,000 |
| YouTube subscribers | 1,000 | 5,000 |
| Customer satisfaction | 4.2/5 | 4.5/5 |
| Repeat customer rate | 20% | 35% |
| Service bookings | 30/month | 80/month |
| B2B contracts | 1 | 5 |
| AI chatbot resolution rate | 60% | 80% |

---

## 13. Agent Task Checklist

> **For AI agents:** Use this section as your work queue. Read `/home/z/my-project/worklog.md` before starting, and append your work log after completing each task.

### Priority A — Immediate (Week 1)

| Task ID | Task | Status |
|---------|------|--------|
| A1 | Run `bun install` in `/home/z/ePowerFix` | ⬜ |
| A2 | Review `.env.example` and document required vars | ⬜ |
| A3 | Run `bun run db:push` to setup database | ⬜ |
| A4 | Run `bun run db:seed` to populate initial data | ⬜ |
| A5 | Start dev server and verify homepage renders | ⬜ |
| A6 | Run `bun run lint` and fix all errors | ⬜ |
| A7 | Audit all pages render without errors (use Agent Browser) | ⬜ |

### Priority B — Pre-Launch (Weeks 2-3)

| Task ID | Task | Status |
|---------|------|--------|
| B1 | Add 50 sample products via admin API | ⬜ |
| B2 | Add 6 services via admin API | ⬜ |
| B3 | Add 10 project kits via admin API | ⬜ |
| B4 | Add 5 portfolio projects | ⬜ |
| B5 | Add 5 SEO blog posts (use LLM skill) | ⬜ |
| B6 | Generate app logo + icons (use Image Generation skill) | ⬜ |
| B7 | Configure homepage banners | ⬜ |
| B8 | Test payment flow in sandbox | ⬜ |
| B9 | Generate legal pages (privacy, terms, refund) | ⬜ |
| B10 | SEO audit: sitemap, robots, OG tags | ⬜ |

### Priority C — PWA Setup (Weeks 4-5)

| Task ID | Task | Status |
|---------|------|--------|
| C1 | Install `@ducanh2912/next-pwa` | ⬜ |
| C2 | Configure PWA in `next.config.ts` | ⬜ |
| C3 | Create `public/manifest.json` | ⬜ |
| C4 | Generate PWA icons (192px, 512px) | ⬜ |
| C5 | Add manifest link in `layout.tsx` | ⬜ |
| C6 | Set up Firebase Cloud Messaging | ⬜ |
| C7 | Add "Install App" smart banner | ⬜ |
| C8 | Test PWA install on Android + iOS | ⬜ |

### Priority D — AI Integration (Weeks 4-5)

| Task ID | Task | Status |
|---------|------|--------|
| D1 | Configure z-ai-web-dev-sdk API key | ⬜ |
| D2 | Set up AI provider in `/admin/ai-providers` | ⬜ |
| D3 | Write system prompt for customer support AI | ⬜ |
| D4 | Feed product catalog into AI context | ⬜ |
| D5 | Test AI chatbot on common queries | ⬜ |
| D6 | Set up content generation workflow (FB posts) | ⬜ |
| D7 | Configure competitor price monitoring cron | ⬜ |

### Priority E — Marketing Setup (Weeks 5-6)

| Task ID | Task | Status |
|---------|------|--------|
| E1 | Create Facebook Page + Group | ⬜ |
| E2 | Set up Facebook Pixel | ⬜ |
| E3 | Create YouTube channel + first video | ⬜ |
| E4 | Set up WhatsApp Business + catalog | ⬜ |
| E5 | Create TikTok account | ⬜ |
| E6 | Build campus ambassador program doc | ⬜ |
| E7 | Prepare B2B proposal PDF | ⬜ |
| E8 | Launch first Facebook ad campaign | ⬜ |

### Priority F — Native App (Month 4+, conditional)

| Task ID | Task | Status |
|---------|------|--------|
| F1 | Set up Expo project | ⬜ |
| F2 | Configure Turborepo monorepo | ⬜ |
| F3 | Migrate shared code (api, types, utils) | ⬜ |
| F4 | Build auth screens | ⬜ |
| F5 | Build home + shop + product screens | ⬜ |
| F6 | Build cart + checkout | ⬜ |
| F7 | Integrate payment SDKs | ⬜ |
| F8 | Configure push notifications | ⬜ |
| F9 | Build & submit to Play Store | ⬜ |
| F10 | Build & submit to App Store | ⬜ |

---

## 📌 Summary for Agent

**Key takeaways:**

1. **Don't rebuild.** The Next.js website is 90% done. Polish it, don't rewrite.
2. **PWA first, native later.** PWA gives app experience in 1 week. React Native (Expo) only when user base justifies (5,000+ users).
3. **Flutter = NO.** Would throw away existing code, requires Dart expertise, kills SEO.
4. **AI is your 24/7 employee.** Use it for support, content, pricing, forecasting.
5. **Marketing channels in priority:** Facebook > WhatsApp > YouTube > Campus ambassadors > B2B direct > TikTok.
6. **Start lean:** 3 people, then scale. Don't overhire.
7. **Track everything:** Use existing admin dashboard for all KPIs.
8. **Bangladesh specifics:** bKash/Nagad/SSL payments, .com.bd domain, Bengali content, local delivery via Pathao/RedX.

**First action for agent:** Complete Priority A tasks (A1-A7) to get the website running locally, then report status.

---

*End of document*
