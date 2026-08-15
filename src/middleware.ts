import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never intercept or redirect on auth pages, registration, Next.js internal bundles or static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development-only';
  const token = await getToken({
    req,
    secret,
  });

  const isApiRoute = pathname.startsWith('/api');
  const isAgencyRoute = pathname.startsWith('/agency') || pathname.startsWith('/api/agency');
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isInvestorRoute = pathname.startsWith('/investors') || pathname.startsWith('/api/investors');

  // Require active authentication for protected agency, investor, and admin routes
  if (!token && (isAgencyRoute || isAdminRoute || isInvestorRoute)) {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Active session required. Please sign in.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    if (isInvestorRoute) {
      loginUrl.searchParams.set('portal', 'investor');
    }
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user handling & role/tenant isolation checks
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
        // e.g. /agency/[agencyId]/dashboard
        if (
          parts[2] &&
          parts[2] !== 'dashboard' &&
          parts[2] !== 'submit-listing' &&
          parts[2] !== 'add-property' &&
          parts[2] !== 'deals' &&
          parts[2] !== 'ledger' &&
          parts[2] !== 'rent-collection' &&
          parts[2] !== 'leaderboard'
        ) {
          requestedAgencyId = parts[2] || null;
        }
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
    '/investors/:path*',
    '/api/investors/:path*',
  ],
};