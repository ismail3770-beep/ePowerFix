// Next.js Proxy — proxies all /api/* requests to Express backend (Railway)
// This proxy runs BEFORE any filesystem route matching.
// Since the Next.js API routes folder has been removed, this proxy
// is the ONLY handler for /api/* requests in the web app.

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

  // If NEXT_PUBLIC_API_BASE_URL is not set, return a clear error.
  // This prevents silent failures when the env var is missing.
  if (!apiBaseUrl && request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.json(
      {
        error: 'API not configured',
        message: 'NEXT_PUBLIC_API_BASE_URL environment variable is not set.',
      },
      { status: 503 }
    )
  }

  return NextResponse.next()
}

export const config = {
  // Only run proxy on /api/* paths
  matcher: '/api/:path*',
}
