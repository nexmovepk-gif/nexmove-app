import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only',
  });

  const { pathname } = req.nextUrl;

  const isApiRoute = pathname.startsWith('/api');
  const isAuthRoute = pathname.startsWith('/api/auth') || pathname.startsWith('/login');
  const isAgencyRoute = pathname.startsWith('/agency') || pathname.startsWith('/api/agency');
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  // Allow authentication routes to proceed
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // Development / mock testing bypass: permit agency routes without a session
  if (process.env.NODE_ENV !== 'production' && isAgencyRoute) {
    return NextResponse.next();
  }

  // Require authentication for protected agency and admin routes
  if (!token && (isAgencyRoute || isAdminRoute)) {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Please log in' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Authenticated user handling
  if (token) {
    const userRole = token.role;
    const userAgencyId = token.agencyId;

    // Admin route protection
    if (isAdminRoute) {
      if (userRole !== 'SUPER_ADMIN') {
        if (isApiRoute) {
          return new NextResponse(
            JSON.stringify({ error: 'Forbidden: Super Admin access required' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
      return NextResponse.next();
    }

    // Agency isolation – ensure user accesses their own agency data
    if (isAgencyRoute) {
      if (userRole === 'SUPER_ADMIN') {
        return NextResponse.next();
      }

      let requestedAgencyId: string | null = null;

      if (pathname.startsWith('/api/agency/')) {
        const parts = pathname.split('/');
        requestedAgencyId = parts[3] || null;
      } else if (pathname.startsWith('/agency/')) {
        const parts = pathname.split('/');
        requestedAgencyId = parts[2] || null;
      }

      if (requestedAgencyId && userAgencyId !== requestedAgencyId) {
        if (isApiRoute) {
          return new NextResponse(
            JSON.stringify({ error: "Forbidden: You do not have access to this agency's data" }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }
  }

  return NextResponse.next();
}

// Configure routes where the middleware should run
export const config = {
  matcher: [
    '/agency/:path*',
    '/api/agency/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};