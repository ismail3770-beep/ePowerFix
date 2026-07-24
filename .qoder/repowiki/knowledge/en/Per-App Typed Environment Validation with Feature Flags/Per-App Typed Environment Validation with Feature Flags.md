---
kind: configuration_system
name: Per-App Typed Environment Validation with Feature Flags
category: configuration_system
scope:
    - '**'
source_files:
    - apps/api/src/config/env.ts
    - apps/api/src/config/env.test.ts
    - apps/api/src/server.ts
    - apps/web/src/lib/env.ts
    - apps/web/next.config.ts
    - apps/api/.env.example
    - apps/web/.env.example
    - apps/mobile/.env.example
---

The monorepo uses a per-application, typed environment configuration strategy. Each app owns its own .env/.env.example files and a dedicated loader that validates, coerces, and exposes runtime configuration through a strongly-typed env object rather than reading process.env directly. There is no shared config package — the pattern is duplicated consistently across apps.

API (apps/api/src/config/env.ts)
- Exposes loadEnv(source?) which reads from an injected source (default process.env) and returns a fully typed EnvShape.
- Provides helpers: optional, featureFlag (boolean coercion with strict validation), validateUrl, and validateCompleteGroup for atomic multi-key groups (e.g., Upstash Redis, SSLCommerz, bKash, Nagad, Cloudinary).
- Enforces production-only invariants at startup: DATABASE_URL required, JWT_SECRET >= 32 chars, WEB_URL must not be localhost, PAYMENT_TEST_MODE must be off, and PAYMENT_CALLBACK_IP_WHITELIST required when any payment gateway is configured.
- Feature flags (MARKETPLACE_ENABLED, PROVIDER_ONBOARDING_ENABLED, MARKETPLACE_PAYMENTS_ENABLED, LIVE_TRACKING_ENABLED, AUTO_MATCHING_ENABLED) are parsed via featureFlag and default to false.
- A companion test file (env.test.ts) asserts validation rules, group completeness, feature-flag parsing, and port bounds.
- The Express server (server.ts) imports the singleton env and uses it for CORS origins, rate limiting, logging format, and worker lifecycle decisions.

Web (apps/web/src/lib/env.ts)
- Similar shape-based validation for Next.js runtime variables: DATABASE_URL, JWT_SECRET, NEXTAUTH_SECRET are always required; NEXT_PUBLIC_BASE_URL, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN become required in production.
- Warns on short secrets and prints a helpful setup message listing missing keys.
- Exported as a module-level env constant consumed by API client and auth modules.

Mobile (apps/mobile/.env.example)
- Minimal: only EXPO_PUBLIC_API_BASE_URL is documented, pointing at the Railway-hosted API or local dev. Expo's EXPO_PUBLIC_* prefix makes the value available at build time to the React Native bundle.

Next.js build-time wiring (apps/web/next.config.ts)
- Reads NEXT_PUBLIC_API_BASE_URL to rewrite /api/* requests to the backend during development and production.
- Security headers and image remote patterns are also driven by env-aware logic.

Environment file conventions
- Every app ships a .env.example documenting all supported keys with comments explaining purpose, defaults, and security notes (e.g., secret length requirements, IP whitelist guidance for payment callbacks).
- Actual .env files are gitignored and never committed.

Deployment integration
- Railway injects PORT and other vars at runtime; the API trusts the proxy (trust proxy: 1) so rate-limiting and callback IP whitelisting work behind Caddy/Nginx.
- The web app proxies /api/* to the API URL derived from NEXT_PUBLIC_API_BASE_URL; mobile points at the same Railway domain.