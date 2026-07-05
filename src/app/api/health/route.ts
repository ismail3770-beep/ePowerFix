import { NextRequest } from 'next/server'
import { getHealthStatus } from '@/lib/monitoring'

/**
 * GET /api/health
 * Public health check endpoint — no auth required.
 * Returns database connectivity, memory usage, and uptime.
 * Used by load balancers, monitoring tools, and CI/CD pipelines.
 */
export async function GET() {
  try {
    const health = await getHealthStatus()
    const status = health.status === 'healthy' ? 200 : 503
    return Response.json(health, { status })
  } catch (err: any) {
    return Response.json(
      { status: 'unhealthy', error: err?.message || 'Unknown error' },
      { status: 503 },
    )
  }
}
