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
  const isInvestorRoute =
    pathname.startsWith('/investor') ||
    pathname.startsWith('/investors') ||
    pathname.startsWith('/api/investor') ||
    pathname.startsWith('/api/investors');
  const isArchitectDashboardRoute =
    pathname.startsWith('/architects/dashboard') ||
    pathname.startsWith('/api/architects/dashboard');
  const isUserDashboardRoute =
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/');

  // 1. Unauthenticated Redirections with contextual role query params
  if (!token && (isAgencyRoute || isAdminRoute || isInvestorRoute || isArchitectDashboardRoute || isUserDashboardRoute)) {
    if (isApiRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Active session required. Please sign in.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const loginUrl = new URL('/login', req.url);
    if (isArchitectDashboardRoute) {
      loginUrl.searchParams.set('role', 'architect');
      loginUrl.searchParams.set('callbackUrl', pathname);
    } else if (isInvestorRoute) {
      loginUrl.searchParams.set('role', 'investor');
      loginUrl.searchParams.set('callbackUrl', pathname === '/investors' ? '/investors/dashboard' : pathname);
    } else if (isAgencyRoute) {
      loginUrl.searchParams.set('role', 'agency');
      loginUrl.searchParams.set('callbackUrl', pathname === '/agency' ? '/agency/dashboard' : pathname);
    } else if (isAdminRoute) {
      loginUrl.searchParams.set('role', 'admin');
      loginUrl.searchParams.set('callbackUrl', pathname);
    } else {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user handling & Role-Based Access Control (RBAC)
  if (token) {
    const userRole = token.role as string | undefined;
    const userEmail = (token.email as string | undefined)?.toLowerCase();
    const userAccountRoleType = token.accountRoleType as string | undefined;
    const userAgencyId = token.agencyId as string | null | undefined;
    const isArchitect = Boolean(token.isArchitect);

    const isSuperAdmin = userEmail === 'nexmove.pk@gmail.com' || userRole === 'SUPER_ADMIN';

    // 👑 3. Super Admin Override: Full cross-portal access
    if (isSuperAdmin) {
      return NextResponse.next();
    }

    // Admin route protection: Only Super Admin allowed
    if (isAdminRoute) {
      if (isApiRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden: Super Admin access required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // Identify user category strictly
    const isArchitectUser = isArchitect || userRole === 'ARCHITECT';

    const isAgencyUser =
      !isArchitectUser &&
      (userRole === 'AGENCY_MANAGER' ||
        userRole === 'AGENCY_AGENT' ||
        userAccountRoleType === 'AGENCY_ADMIN' ||
        userAccountRoleType === 'AGENCY_AGENT' ||
        userAccountRoleType === 'AGENCY_MANAGER' ||
        userAccountRoleType === 'OVERSEAS_AGENCY' ||
        Boolean(userAgencyId));

    const isInvestorUser =
      !isArchitectUser &&
      !isAgencyUser &&
      userAccountRoleType === 'OVERSEAS_INVESTOR';

    const isRegularPublicUser =
      !isArchitectUser &&
      !isAgencyUser &&
      !isInvestorUser;

    // Rule 2a: Architect Dashboard protection
    if (isArchitectDashboardRoute) {
      if (!isArchitectUser) {
        if (isApiRoute) {
          return new NextResponse(
            JSON.stringify({ error: 'Forbidden: Architect account required' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        if (isAgencyUser) {
          const redirectUrl = new URL('/agency/dashboard', req.url);
          redirectUrl.searchParams.set('unauthorized', 'architect_portal_restricted');
          return NextResponse.redirect(redirectUrl);
        }
        if (isInvestorUser) {
          const redirectUrl = new URL('/investors/dashboard', req.url);
          redirectUrl.searchParams.set('unauthorized', 'architect_portal_restricted');
          return NextResponse.redirect(redirectUrl);
        }
        const redirectUrl = new URL('/dashboard', req.url);
        redirectUrl.searchParams.set('unauthorized', 'architect_portal_restricted');
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Rule 2b: If an Architect tries to visit Agency or Investor portals
    if (isArchitectUser) {
      if (isAgencyRoute && pathname.includes('/dashboard')) {
        if (isApiRoute) {
          return new NextResponse(
            JSON.stringify({ error: 'Forbidden: Architect accounts cannot access Agency portals' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const redirectUrl = new URL('/architects/dashboard', req.url);
        redirectUrl.searchParams.set('unauthorized', 'agency_portal_restricted');
        return NextResponse.redirect(redirectUrl);
      }
      if (isInvestorRoute && pathname.includes('/dashboard')) {
        if (isApiRoute) {
          return new NextResponse(
            JSON.stringify({ error: 'Forbidden: Architect accounts cannot access Investor portals' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const redirectUrl = new URL('/architects/dashboard', req.url);
        redirectUrl.searchParams.set('unauthorized', 'investor_portal_restricted');
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Rule 2c: If an authenticated user with role INVESTOR tries to visit /agency/..., redirect to /investors/dashboard
    if (!isInvestorRoute && isAgencyRoute) {
      if (isInvestorUser) {
        if (isApiRoute) {
          return new NextResponse(
            JSON.stringify({ error: 'Forbidden: Investor accounts cannot access Agency portals' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const redirectUrl = new URL('/investors/dashboard', req.url);
        redirectUrl.searchParams.set('unauthorized', 'agency_portal_restricted');
        return NextResponse.redirect(redirectUrl);
      }
      // If a regular public user tries to access /agency/..., redirect them to /dashboard (NEVER /investors/dashboard)
      if (isRegularPublicUser) {
        if (isApiRoute) {
          return new NextResponse(
            JSON.stringify({ error: 'Forbidden: Agency account required' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const redirectUrl = new URL('/dashboard', req.url);
        redirectUrl.searchParams.set('unauthorized', 'agency_portal_restricted');
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Rule 2d: If an authenticated user with role AGENCY tries to visit /investors/..., redirect to /agency/dashboard
    if (isInvestorRoute) {
      if (isAgencyUser) {
        if (isApiRoute) {
          return new NextResponse(
            JSON.stringify({ error: 'Forbidden: Agency accounts cannot access Investor portals' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const redirectUrl = new URL('/agency/dashboard', req.url);
        redirectUrl.searchParams.set('unauthorized', 'investor_portal_restricted');
        return NextResponse.redirect(redirectUrl);
      }
      // If a regular public user tries to access /investors/..., redirect them to /dashboard (NEVER loop to /investors/dashboard)
      if (isRegularPublicUser) {
        if (isApiRoute) {
          return new NextResponse(
            JSON.stringify({ error: 'Forbidden: Overseas Investor account required' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const redirectUrl = new URL('/dashboard', req.url);
        redirectUrl.searchParams.set('unauthorized', 'investor_portal_restricted');
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Tenant isolation inside /agency/ routes (for agency users accessing other agencies)
    if (isAgencyRoute) {
      let requestedAgencyId: string | null = null;

      if (pathname.startsWith('/api/agency/')) {
        const parts = pathname.split('/');
        requestedAgencyId = parts[3] || null;
      } else if (pathname.startsWith('/agency/')) {
        const parts = pathname.split('/');
        if (
          parts[2] &&
          parts[2] !== 'dashboard' &&
          parts[2] !== 'properties' &&
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

      if (requestedAgencyId && userAgencyId && userAgencyId !== requestedAgencyId) {
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
    '/dashboard/:path*',
    '/agency/:path*',
    '/api/agency/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
    '/investors/:path*',
    '/investor/:path*',
    '/api/investors/:path*',
    '/api/investor/:path*',
    '/architects/dashboard/:path*',
  ],
};