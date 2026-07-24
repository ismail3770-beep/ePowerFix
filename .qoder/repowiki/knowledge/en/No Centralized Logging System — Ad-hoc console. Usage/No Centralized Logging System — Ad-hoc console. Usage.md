---
kind: logging_system
name: No Centralized Logging System — Ad-hoc console.* Usage
category: logging_system
scope:
    - '**'
source_files:
    - apps/api/src/config/env.ts
    - apps/api/src/lib/payments.ts
    - apps/api/src/lib/email.ts
    - apps/api/src/lib/order-reservations.ts
    - apps/api/src/lib/rate-limit.ts
---

This repository does not implement a centralized logging system. Across the codebase, logging is done exclusively through bare `console.log`, `console.error`, `console.warn`, and `console.info` calls scattered throughout business logic files (e.g., `apps/api/src/lib/payments.ts`, `apps/api/src/lib/email.ts`, `apps/api/src/lib/order-reservations.ts`, `apps/api/src/config/env.ts`). There is no dedicated logger module, no structured logging library (pino, winston, bun:log), no log-level configuration, and no central sink or transport. Each module formats its own messages with ad-hoc string prefixes like `[email]`, `[SSLCommerz]`, `[bKash]`, `[payment-reservations]`. The web and mobile apps similarly rely on browser/device `console.*` without any aggregation or enrichment. As a result, there are no conventions for log levels, correlation IDs, JSON-structured output, or routing logs to external systems.