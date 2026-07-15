# ePowerFix Project — AI Agent Instructions

## Project Overview
ePowerFix is an electrical e-commerce, services, and student project platform for Bangladesh.
Built as a Turborepo monorepo with Next.js, Express, and Expo React Native.

## Architecture
```
ePowerFix/
├── apps/
│   ├── web/          ← Next.js 16 (Vercel, LIVE: epowerfix.com)
│   ├── api/          ← Express.js (Railway, LIVE)
│   └── mobile/       ← Expo React Native (in development)
├── packages/
│   ├── types/        ← Shared TypeScript types
│   ├── api-client/   ← Shared API calls
│   ├── store/        ← Shared Zustand stores
│   └── utils/        ← Shared utilities
├── prisma/           ← PostgreSQL schema (Neon)
└── docs/             ← Documentation
```

## Design System (CRITICAL)
- **Primary color:** epf-500 (#0EA5E9 sky blue)
- **Background:** slate-100 (#F1F5F9)
- **Header:** white + slate-900 nav bar
- **Cards:** white with slate-200 borders
- **Icons:** lucide-react (web) / lucide-react-native (mobile)
- **Typography:** Inter / Noto Sans Bengali

## Mobile App Rules (CRITICAL)
- **NO NativeWind** — use inline styles only (`style={{}}`)
- All colors from `src/theme/design-system.ts`
- Use `lucide-react-native` for icons
- Expo Router for navigation
- Match website design exactly (Header, PremiumCard, Footer)

## Backend Rules
- Express.js on Railway
- JWT auth (cookie for web, Bearer token for mobile)
- Prisma ORM with PostgreSQL (Neon)
- Redis caching (Upstash)
- Input validation with Zod

## Strict Rules for AI Agent
1. **NEVER modify** `apps/web/` or `apps/api/` without explicit permission
2. **One task at a time** — don't rush or do multiple things
3. **Always test** before committing changes
4. **Use Bengali** for user-facing text (buttons, labels, messages)
5. **Follow existing patterns** — check similar files before writing new code
6. **Commit messages** in English, descriptive
7. **No emojis** in code unless explicitly requested
8. **TypeScript strict** — no `any` type where avoidable

## Current Status
- Web: LIVE (Vercel)
- API: LIVE (Railway)
- Mobile: In development (basic screens done)
- Database: LIVE (Neon PostgreSQL)

## API Endpoints
- Production: https://epowerfix-production.up.railway.app
- Local dev: http://localhost:4000

## File Locations
- Design system: `apps/mobile/src/theme/design-system.ts`
- PremiumCard: `apps/mobile/src/components/PremiumCard.tsx`
- Footer: `apps/mobile/src/components/Footer.tsx`
- Colors: `apps/mobile/src/theme/colors.ts`

## Payment Gateways
- bKash, Nagad, SSLCommerz (Bangladesh)

## Important Notes
- This is a production project — be careful with changes
- Always backup before major changes
- Test on both web and mobile
- Optimize for performance (Bangladesh users have slow internet)
