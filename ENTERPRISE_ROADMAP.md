# 📋 ePowerFix — 4-Week Enterprise Modernization Roadmap

## Overview
This roadmap transforms the ePowerFix monolith from a functional prototype
into an enterprise-grade, observable, and reliable production system —
without any downtime.

---

## Week 1: Observability + Health Checks

### Goal
Gain full visibility into errors, performance, and system health.

### Tasks

| # | Task | Files | Priority |
|---|------|-------|----------|
| 1.1 | Install Sentry SDK | `bun add @sentry/nextjs` | High |
| 1.2 | Configure Sentry | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` | High |
| 1.3 | Wire `captureError` into `api-handler.ts` | `src/lib/api-handler.ts` (already imports `monitoring.ts`) | High |
| 1.4 | Add `SENTRY_DSN` to `.env` + Vercel env vars | `.env`, Vercel dashboard | High |
| 1.5 | Deploy `/api/health` endpoint | Already created at `src/app/api/health/route.ts` | Done ✅ |
| 1.6 | Set up UptimeRobot / Better Stack monitor | External — ping `/api/health` every 60s | Medium |
| 1.7 | Add `startSpan` to top 5 slowest API routes | `admin/products`, `admin/orders`, `products`, `project-kits` | Medium |

### Acceptance Criteria
- [ ] Sentry dashboard shows errors within 30s of occurrence
- [ ] `/api/health` returns 200 with DB + memory status
- [ ] Slow DB queries (>100ms) are logged with duration

---

## Week 2: CI/CD Pipeline + Testing Foundation

### Goal
Automate quality checks and deployment. No more "it works on my machine."

### Tasks

| # | Task | Files | Priority |
|---|------|-------|----------|
| 2.1 | Add GitHub Actions workflow | `.github/workflows/main.yml` | Done ✅ |
| 2.2 | Add GitHub Secrets | `DATABASE_URL`, `JWT_SECRET`, `VERCEL_TOKEN`, etc. | High |
| 2.3 | Install Vitest | `bun add -d vitest @vitest/coverage-v8` | High |
| 2.4 | Write unit tests for API validation | `src/lib/api-handler.test.ts`, `src/lib/auth.test.ts` | High |
| 2.5 | Write integration tests for top 5 routes | `src/app/api/products.test.ts`, `orders.test.ts`, etc. | Medium |
| 2.6 | Set up Vercel staging environment | Vercel dashboard → preview deployments | High |
| 2.7 | Enable auto-deploy on `main` push | Vercel + GitHub integration | High |

### Acceptance Criteria
- [ ] Every PR triggers CI (lint + typecheck + test + build)
- [ ] Merged PRs auto-deploy to Vercel staging
- [ ] At least 20 unit tests covering API validation

---

## Week 3: Redis Caching + Performance

### Goal
Reduce database load by 60%+ for read-heavy endpoints.

### Tasks

| # | Task | Files | Priority |
|---|------|-------|----------|
| 3.1 | Provision Redis instance | Upstash Redis (free tier, serverless) | High |
| 3.2 | Add `REDIS_URL` to `.env` | `.env`, Vercel env vars | High |
| 3.3 | Install ioredis | `bun add ioredis` | High |
| 3.4 | Integrate cache into settings route | `src/app/api/settings/route.ts` — use `cache.getOrSet` | High |
| 3.5 | Integrate cache into product-categories | `src/app/api/product-categories/route.ts` | High |
| 3.6 | Integrate cache into brands | `src/app/api/brands/route.ts` | High |
| 3.7 | Integrate cache into products list | `src/app/api/products/route.ts` | Medium |
| 3.8 | Add cache invalidation to admin PUT/POST/DELETE | Each admin `[id]/route.ts` → `cache.invalidatePattern` | High |
| 3.9 | Add server-side pagination to shop page | Move filter logic from client to API (Prisma `take`/`skip`) | Medium |
| 3.10 | Configure `next/image` with CDN | `next.config.ts` (already configured) | Done ✅ |

### Acceptance Criteria
- [ ] Redis connected (check `/api/health` — add Redis check)
- [ ] Settings/categories/brands cached for 5 min
- [ ] Admin updates invalidate cache within 1s
- [ ] Page load time reduced by 30%+ on shop page

---

## Week 4: Modernization + Hardening

### Goal
Leverage Next.js 16 features for better type safety and performance.

### Tasks

| # | Task | Files | Priority |
|---|------|-------|----------|
| 4.1 | Remove `ignoreBuildErrors: true` | `next.config.ts` → fix all type errors | High |
| 4.2 | Re-enable critical ESLint rules | `eslint.config.mjs` → `no-explicit-any: warn`, `exhaustive-deps: warn` | High |
| 4.3 | Enable `reactStrictMode: true` | `next.config.ts` | Medium |
| 4.4 | Migrate contact form to Server Action | `src/app/contact/actions.ts` — `'use server'` | Medium |
| 4.5 | Migrate newsletter signup to Server Action | `src/app/actions/newsletter.ts` | Medium |
| 4.6 | Add CSRF protection for mutations | Middleware or same-origin check | High |
| 4.7 | Add rate limiting via Redis (replace in-memory) | `src/lib/rate-limit.ts` → use Redis `INCR` + `EXPIRE` | Medium |
| 4.8 | Set up Sentry Performance Monitoring | `sentry.server.config.ts` → enable traces | Medium |
| 4.9 | Production smoke tests | Manual test checklist on staging | High |
| 4.10 | Create rollback procedure | Document: `git revert` + Vercel instant rollback | High |

### Acceptance Criteria
- [ ] `next build` succeeds with `ignoreBuildErrors: false`
- [ ] No `any` types in new code (ESLint warns)
- [ ] Contact form uses Server Action (no `/api/contact` POST needed)
- [ ] Rate limiting works across multiple server instances (Redis-backed)
- [ ] Full smoke test passes on staging before production deploy

---

## 🚦 Zero-Downtime Deployment Strategy

### Branch Strategy
```
main (production) ←── PR ←── develop (staging) ←── feature/* branches
```

### Rollout Process
1. **Feature branch** → PR to `develop`
2. **CI runs** → lint, typecheck, test, build
3. **Auto-deploy** to Vercel staging (preview URL)
4. **Manual smoke test** on staging URL
5. **PR merge** → `develop` → auto-deploy to staging
6. **Production PR** → `develop` → `main`
7. **Auto-deploy** to Vercel production
8. **Health check** → `/api/health` must return 200
9. **If unhealthy** → Vercel instant rollback (1 click)

### Database Migration Safety
- Always use `prisma migrate` (not `db:push`) in production
- Test migrations on staging first
- Never run destructive migrations during peak hours
- Keep a backup before any schema change

---

## 📊 Success Metrics (After 4 Weeks)

| Metric | Current | Target |
|--------|---------|--------|
| Error tracking | None | Sentry with <30s alerting |
| CI/CD | Manual | Fully automated (push → deploy) |
| Test coverage | 0% | 20%+ (critical paths) |
| Cache hit rate | 0% | 60%+ (read-heavy routes) |
| Page load (shop) | ~3s | <1.5s |
| API response (products) | ~200ms | <80ms |
| Uptime | Unknown | 99.9% (monitored) |
| Type safety | ignoreBuildErrors | Full strict mode |
