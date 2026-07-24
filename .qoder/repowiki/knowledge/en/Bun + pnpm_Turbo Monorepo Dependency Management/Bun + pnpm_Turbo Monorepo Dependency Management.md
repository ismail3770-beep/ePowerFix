---
kind: dependency_management
name: Bun + pnpm/Turbo Monorepo Dependency Management
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - pnpm-workspace.yaml
    - .npmrc
    - bun.lock
    - turbo.json
    - apps/api/package.json
    - apps/web/package.json
    - apps/mobile/package.json
    - packages/api-client/package.json
    - packages/types/package.json
    - packages/store/package.json
    - packages/utils/package.json
---

The ePowerFix monorepo manages dependencies through a hybrid setup centered on Bun as the runtime and package manager, with pnpm workspace declarations and Turbo for task orchestration. The root `package.json` declares workspaces under `apps/*` and `packages/*`, pins the engine to Node ≥22 and Bun 1.3.14 via `engines`, and sets `packageManager: "bun@1.3.14"`. A lockfile (`bun.lock`) is committed and records every workspace's resolved dependency tree. An `.npmrc` file configures pnpm with `node-linker=hoisted` so that Prisma client (which requires a flat node_modules layout) resolves correctly even when invoked from within the workspace.

Workspace packages live under `packages/` — `@epowerfix/types`, `@epowerfix/utils`, `@epowerfix/store`, and `@epowerfix/api-client` — all marked `private: true` and consumed by apps via the `workspace:*` protocol rather than published versions. Apps under `apps/` (`@epowerfix/api`, `@epowerfix/web`, `@epowerfix/mobile`) declare their own per-app dependencies and devDependencies; shared tooling such as Prisma, TypeScript, and Turborepo are pinned at the root level. Cross-app version conflicts are reconciled at the root using an `overrides` block (e.g., forcing `react` to `19.2.3` and `react-native-screens` to `~4.26.0`).

Turborepo (`turbo.json`) defines task graphs (`build`, `dev`, `lint`, `clean`) with `dependsOn: ["^build"]` so downstream tasks automatically wait for upstream builds, and caches outputs like `.next/**` and `dist/**`. Each app exposes its own scripts (`dev`, `build`, `start`, `lint`, `typecheck`) which are invoked through the root `turbo dev` / `turbo build` entry points. The mobile app additionally runs a `postinstall` hook in `apps/web/package.json` to regenerate Prisma types against the shared schema at `prisma/schema.prisma`.

No private npm registry or vendoring strategy is configured beyond the standard public registry; there is no `.npmrc` auth section, no `GOPRIVATE`, and no vendored third-party source. Security scanning is delegated to a custom script (`bun scripts/security-audit.ts`) wired as `security:audit`.