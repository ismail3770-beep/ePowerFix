// Next.js Middleware — proxies all /api/* requests to Express backend (Railway)
// Middleware runs BEFORE filesystem routes, so it takes priority over
// the existing Next.js API routes in src/app/api/

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  // If API base URL is set, proxy all /api/* requests to the Express backend
  if (apiBaseUrl && request.nextUrl.pathname.startsWith('/api')) {
    // Build the target URL on the Express API server
    const target = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      apiBaseUrl
    )

    // Clone request headers and update host for the proxy target
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('host', target.host)
    requestHeaders.set('x-forwarded-host', request.nextUrl.host)
    requestHeaders.set('x-forwarded-proto', request.nextUrl.protocol.replace(':', ''))

    // Rewrite to the external Express API — NextResponse.rewrite() with an
    // absolute URL acts as a proxy, forwarding method, body, and headers.
    return NextResponse.rewrite(target, {
      headers: requestHeaders,
    })
  }

  // No API base URL set — fall through to Next.js API routes (legacy mode)
  return NextResponse.next()
}

export const config = {
  // Only run middleware on /api/* paths
  matcher: '/api/:path*',
}
