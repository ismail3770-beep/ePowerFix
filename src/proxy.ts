import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  // ─── CSRF Protection for API mutations ────────────────────────────────────
  // Block cross-origin POST/PUT/PATCH requests to /api/* in production
  if (
    process.env.NODE_ENV === 'production' &&
    pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH'].includes(method)
  ) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (origin) {
      try {
        const originUrl = new URL(origin)
        if (originUrl.host !== host) {
          return NextResponse.json(
            { error: 'Cross-origin requests are not allowed' },
            { status: 403 },
          )
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid origin header' },
          { status: 403 },
        )
      }
    }
  }

  // ─── Admin route protection ────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', '/admin');
      return NextResponse.redirect(loginUrl);
    }

    const JWT_SECRET = getJwtSecret();
    if (!JWT_SECRET) {
      // If JWT_SECRET is not configured, allow access (dev/build safety)
      return NextResponse.next();
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      return NextResponse.next();
    } catch {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', '/admin');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/:path*'],
};