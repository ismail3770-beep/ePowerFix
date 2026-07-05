/**
 * Stress Testing Script — ePowerFix API
 *
 * Simulates concurrent API requests against the top 10 most-used routes.
 * Measures latency (p50, p90, p99), logs failures, and triggers Sentry.
 *
 * Usage:
 *   bun run scripts/stress-test.ts
 *   # or
 *   npx tsx scripts/stress-test.ts
 *
 * Prerequisites:
 *   - Dev server running on http://localhost:3000
 *   - (Optional) SENTRY_DSN set in .env for error reporting
 */

const BASE_URL = process.env.STRESS_TEST_URL || 'http://localhost:3000'
const CONCURRENT_USERS = 10
const ROUNDS = 5
const TIMEOUT_MS = 10000

interface RouteResult {
  route: string
  total: number
  success: number
  failed: number
  p50: number
  p90: number
  p99: number
  avg: number
  min: number
  max: number
  errors: string[]
}

const ROUTES: { method: string; path: string }[] = [
  { method: 'GET', path: '/api/products?limit=20' },
  { method: 'GET', path: '/api/products?limit=6' },
  { method: 'GET', path: '/api/settings' },
  { method: 'GET', path: '/api/services' },
  { method: 'GET', path: '/api/project-kits' },
  { method: 'GET', path: '/api/banners' },
  { method: 'GET', path: '/api/product-categories' },
  { method: 'GET', path: '/api/brands' },
  { method: 'GET', path: '/api/blog?limit=12' },
  { method: 'GET', path: '/api/health' },
]

let Sentry: any = null

async function initSentry() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return
  try {
    Sentry = await import('@sentry/node')
    Sentry.init({ dsn, environment: 'stress-test', tracesSampleRate: 1.0 })
    console.log('✅ Sentry initialized for stress test')
  } catch {
    console.log('⚠️  @sentry/node not installed — console-only logging')
  }
}

function reportError(route: string, error: string) {
  console.error(`  ❌ [${route}] ${error}`)
  if (Sentry) Sentry.captureMessage(`Stress test failure: ${route} — ${error}`, 'error')
}

async function makeRequest(method: string, path: string): Promise<{ status: number; latency: number; error?: string }> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    const res = await fetch(`${BASE_URL}${path}`, { method, signal: controller.signal })
    clearTimeout(timeout)
    const latency = Date.now() - start
    if (!res.ok) {
      const text = await res.text().catch(() => 'unknown')
      return { status: res.status, latency, error: `HTTP ${res.status}: ${text.slice(0, 200)}` }
    }
    return { status: res.status, latency }
  } catch (err: any) {
    return { status: 0, latency: Date.now() - start, error: err?.name === 'AbortError' ? 'Timeout' : err?.message || 'Network error' }
  }
}

async function stressRoute(route: { method: string; path: string }): Promise<RouteResult> {
  const label = `${route.method} ${route.path}`
  const latencies: number[] = []
  const errors: string[] = []
  let success = 0
  let failed = 0
  const total = CONCURRENT_USERS * ROUNDS

  for (let round = 0; round < ROUNDS; round++) {
    const promises = Array.from({ length: CONCURRENT_USERS }, () => makeRequest(route.method, route.path))
    const results = await Promise.all(promises)
    for (const result of results) {
      latencies.push(result.latency)
      if (result.error || result.status >= 400) {
        failed++
        const errMsg = result.error || `HTTP ${result.status}`
        if (errors.length < 3) errors.push(errMsg)
        reportError(label, errMsg)
      } else {
        success++
      }
    }
  }

  latencies.sort((a, b) => a - b)
  const percentile = (p: number) => latencies[Math.max(0, Math.ceil(latencies.length * p) - 1)]

  return {
    route: label, total, success, failed, latencies,
    p50: percentile(0.5), p90: percentile(0.9), p99: percentile(0.99),
    avg: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
    min: latencies[0] || 0, max: latencies[latencies.length - 1] || 0, errors,
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  ePowerFix API Stress Test')
  console.log(`  Target: ${BASE_URL}`)
  console.log(`  Routes: ${ROUTES.length} | Concurrency: ${CONCURRENT_USERS}×${ROUNDS} = ${CONCURRENT_USERS * ROUNDS} req/route`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  await initSentry()

  try {
    const health = await fetch(`${BASE_URL}/api/health`, { signal: AbortSignal.timeout(5000) })
    if (!health.ok) throw new Error(`Health check ${health.status}`)
    console.log('✅ Server is running\n')
  } catch (err: any) {
    console.error(`❌ Server not reachable: ${err?.message}\n   Run: bun run dev`)
    process.exit(1)
  }

  const results: RouteResult[] = []
  for (const route of ROUTES) {
    process.stdout.write(`  Testing ${route.method} ${route.path}...`)
    const result = await stressRoute(route)
    results.push(result)
    const status = result.failed === 0 ? '✅' : result.success > 0 ? '⚠️' : '❌'
    console.log(` ${status} ${result.success}/${result.total} ok, avg ${result.avg}ms, p99 ${result.p99}ms`)
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  RESULTS SUMMARY')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('Route'.padEnd(45) + 'Total'.padEnd(8) + 'OK'.padEnd(8) + 'Fail'.padEnd(8) + 'Avg'.padEnd(8) + 'p50'.padEnd(8) + 'p90'.padEnd(8) + 'p99'.padEnd(8) + 'Max')
  console.log('-'.repeat(120))

  let totalReq = 0, totalOk = 0, totalFail = 0
  for (const r of results) {
    console.log(r.route.padEnd(45) + String(r.total).padEnd(8) + String(r.success).padEnd(8) + String(r.failed).padEnd(8) + (r.avg + 'ms').padEnd(8) + (r.p50 + 'ms').padEnd(8) + (r.p90 + 'ms').padEnd(8) + (r.p99 + 'ms').padEnd(8) + r.max + 'ms')
    totalReq += r.total; totalOk += r.success; totalFail += r.failed
    r.errors.forEach(e => console.log(`    └─ ❌ ${e}`))
  }
  console.log('-'.repeat(120))
  console.log('TOTAL'.padEnd(45) + String(totalReq).padEnd(8) + String(totalOk).padEnd(8) + String(totalFail).padEnd(8) + `${Math.round(results.reduce((a, r) => a + r.avg, 0) / results.length)}ms`)

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  INSIGHTS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  const slow = results.filter(r => r.p99 > 500)
  console.log(slow.length > 0 ? `⚠️  Slow routes (p99 > 500ms):\n${slow.map(r => `   • ${r.route}: p99=${r.p99}ms`).join('\n')}` : '✅ All routes p99 < 500ms')

  const failing = results.filter(r => r.failed > 0)
  console.log(failing.length > 0 ? `\n❌ Failing routes:\n${failing.map(r => `   • ${r.route}: ${r.failed} failures`).join('\n')}` : '\n✅ Zero failures')

  if (Sentry) { await Sentry.flush(2000); console.log('\n📤 Errors reported to Sentry') }
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Stress test complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  process.exit(totalFail > 0 ? 1 : 0)
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
