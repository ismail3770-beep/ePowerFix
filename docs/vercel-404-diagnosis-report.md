# Diagnosis Report: Registration/Login API 404 on Vercel

Date: 2026-08-01

## TL;DR

The Express API on Vercel is **healthy**. The 404 comes from the **web** Vercel
project, whose `NEXT_PUBLIC_API_BASE_URL` environment variable still points to a
**decommissioned Railway deployment**. Every browser API call is proxied there and
Railway answers `404 Application not found`.

## Verified live evidence

| Test | Result |
|---|---|
| `POST https://e-power-fix-api.vercel.app/api/auth/register` | **201 Created** — API works |
| `POST https://e-power-fix-api.vercel.app/api/auth/login` | **401 Invalid credentials** — route works |
| CORS preflight from `e-power-fix-web.vercel.app` to API | **204** with correct `Access-Control-*` headers |
| `POST https://e-power-fix-web.vercel.app/api/auth/register` (what the browser actually calls) | **404** `{"status":"error","code":404,"message":"Application not found","request_id":"..."}` |

The 404 body is **Railway's platform error format**. It does not exist anywhere in
this codebase (grep-verified), and the Express API's own 404 handler returns a
different shape (`{ "error": "Not found" }`).

## Request flow (deployed production)

1. Browser register page calls `apiFetch("/api/auth/register")`. The **deployed**
   JS bundle uses a relative, same-origin URL (verified by inspecting the live
   `_next/static/chunks`): `fetch("/api/auth/register", { credentials: "include" })`.
2. The request hits `https://e-power-fix-web.vercel.app/api/auth/register`.
3. `src/proxy.ts` (Next.js 16 proxy convention, matcher `/api/:path*`) rewrites it
   to `${NEXT_PUBLIC_API_BASE_URL}/api/auth/register` server-side.
4. `NEXT_PUBLIC_API_BASE_URL` in the **web** Vercel project = old Railway URL
   (service deleted after the migration to Vercel).
5. Railway responds 404 "Application not found" → surfaced to the user.

## Root cause

**Stale environment variable, not a routing/code bug.**

- `apps/api/vercel.json` (`/(.*)` → `/api`) is correct — Vercel routes all paths to
  the single serverless function preserving the original path (proven by the
  direct 201/401 tests).
- `apps/api/api/index.ts` correctly exports the Express app for serverless.
- Express route mounting (`/api/auth`, ...) is correct.
- The `VERCEL !== '1'` listen guard is correct.

## Contributing code issues (fixed in this pass)

1. **`apps/web/src/lib/api.ts`** — the local (not yet deployed) version builds
   absolute cross-origin URLs with a hardcoded fallback domain, contradicting the
   same-origin proxy architecture the comments describe and baking env config into
   the client bundle. Reverted to same-origin relative fetch.
2. **`apps/web/src/proxy.ts`** — returned HTTP 503 when the env var was unset
   instead of falling back to the known production API; stale "Railway" comment.
   Added a safe fallback.
3. **`apps/web/next.config.ts`** — duplicate `typescript` key: the first
   (`ignoreBuildErrors: false`) was silently overridden by the second (`true`).
   Deduplicated, keeping current build behavior.

## Required manual step (cannot be done from the repo)

In **Vercel dashboard → project `web` → Settings → Environment Variables**:

1. Set `NEXT_PUBLIC_API_BASE_URL` = `https://e-power-fix-api.vercel.app`
   (Production + Preview), replacing the dead Railway URL.
2. Redeploy the `web` project (a redeploy is required — env changes do not apply
   to existing deployments).

## Housekeeping

- During diagnosis, one test account was created via the live API:
  `t@t.com` / phone `01700000000` / password `test123`. Delete it from the
  production database.
