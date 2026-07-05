# TypeScript Strict Mode — Incremental Migration Strategy

## Current State
- `tsconfig.json`: `strict: true` but `noImplicitAny: false`
- `next.config.ts`: `typescript.ignoreBuildErrors: true`
- ESLint: `@typescript-eslint/no-explicit-any: "warn"`

## Target State
- `tsconfig.json`: `strict: true` + `noImplicitAny: true`
- `next.config.ts`: `typescript.ignoreBuildErrors: false`
- ESLint: `@typescript-eslint/no-explicit-any: "error"`

## Strategy: 4-Phase Incremental Approach

### Phase 1: Baseline (DONE ✅)
- ESLint `no-explicit-any` set to `"warn"` (not blocking)
- ESLint `no-unused-vars` set to `"warn"`
- `ignoreBuildErrors` remains `true` (don't break production)

### Phase 2: Fix High-Impact Files (Week 1-2)
Target files with the most `any` types:

1. `src/lib/api-handler.ts` — Already typed ✅
2. `src/lib/auth.ts` — Replace `any` with proper types
3. `src/lib/admin-api.ts` — Replace `any` with proper types
4. `src/lib/db.ts` — Already typed ✅
5. `src/app/api/orders/route.ts` — Replace inline `any` with Zod-inferred types
6. `src/app/api/admin/settings/route.ts` — Replace `data: any` with typed object

For each file:
```typescript
// Before:
const data: any = {}
data.name = body.name

// After:
interface UpdateData {
  name?: string
  price?: number
}
const data: UpdateData = {}
```

### Phase 3: Fix API Route Handlers (Week 2-3)
All 110 API routes use `withErrorHandling` which accepts `any[]`.
Replace with proper typed handlers:

```typescript
// Before:
export const GET = withErrorHandling(async (req: NextRequest, { params }) => {
  const auth = await requireAdmin()
  // ... params is any
})

// After:
export const GET = withErrorHandling(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAdmin()
  // ... params is typed
})
```

### Phase 4: Enable Strict Mode (Week 3-4)
1. Set `noImplicitAny: true` in `tsconfig.json`
2. Run `npx tsc --noEmit` — fix remaining errors
3. Set `ignoreBuildErrors: false` in `next.config.ts`
4. Set ESLint `no-explicit-any: "error"`
5. CI/CD pipeline now blocks on type errors

## Tools to Help

```bash
# Count remaining `any` types
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | wc -l

# Find specific files with most `any` usage
grep -rn ": any" src/ --include="*.ts" --include="*.tsx" | cut -d: -f1 | sort | uniq -c | sort -rn | head -20
```

## Estimated Effort
- ~200 `any` types remaining across the codebase
- Each fix takes ~2-5 minutes
- Total: ~8-16 hours of focused work
- Can be done incrementally without breaking production
