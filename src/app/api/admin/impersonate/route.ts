// src/app/api/admin/impersonate/route.ts
// Secure Super Admin User & Agency Impersonation API

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const IMPERSONATION_COOKIE_NAME = 'nexmove_impersonation';

function checkSuperAdmin(session: { user?: { role?: string | null; email?: string | null } } | null): boolean {
  return (
    session?.user?.role === 'SUPER_ADMIN' ||
    session?.user?.email?.toLowerCase() === 'nexmove.pk@gmail.com'
  );
}

// ── GET: Check active impersonation status ────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!checkSuperAdmin(session)) {
    return NextResponse.json({ isActive: false });
  }

  const cookieStore = cookies();
  const rawCookie = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;

  if (!rawCookie) {
    return NextResponse.json({ isActive: false });
  }

  try {
    const data = JSON.parse(decodeURIComponent(rawCookie));
    return NextResponse.json({
      isActive: true,
      targetUser: data.targetUser,
      admin: data.admin,
      destinationUrl: data.destinationUrl,
    });
  } catch {
    return NextResponse.json({ isActive: false });
  }
}

// ── POST: Start impersonation of a target user or agency ──────────────────────
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!checkSuperAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { targetUserId, targetAgencyId } = body;

    if (!targetUserId && !targetAgencyId) {
      return NextResponse.json(
        { error: 'Missing target: targetUserId or targetAgencyId required' },
        { status: 400 }
      );
    }

    let targetUser = null;
    let destinationUrl = '/dashboard';

    // If target is a User
    if (targetUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          agency: true,
          architectProfile: true,
        },
      });

      if (!dbUser) {
        return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
      }

      const isArchitect = Boolean(dbUser.architectProfile);
      const isAgency = Boolean(dbUser.agencyId || dbUser.accountRoleType?.includes('AGENCY') || dbUser.role === 'AGENCY_AGENT' || dbUser.role === 'AGENCY_MANAGER');
      const isOverseas = Boolean(dbUser.isOverseasVerified || dbUser.accountRoleType?.includes('OVERSEAS'));

      if (isArchitect) {
        destinationUrl = '/architects/dashboard';
      } else if (isAgency) {
        destinationUrl = '/agency/dashboard';
      } else if (isOverseas) {
        destinationUrl = '/overseas/dashboard';
      } else {
        destinationUrl = '/dashboard';
      }

      targetUser = {
        id: dbUser.id,
        name: dbUser.name || 'User',
        email: dbUser.email,
        role: dbUser.role,
        accountRoleType: dbUser.accountRoleType || null,
        agencyId: dbUser.agencyId || null,
        agencyName: dbUser.agency?.name || null,
        isArchitect,
      };
    }

    // If target is an Agency
    if (targetAgencyId && !targetUser) {
      const dbAgency = await prisma.agency.findUnique({
        where: { id: targetAgencyId },
        include: {
          users: { take: 1 },
        },
      });

      if (!dbAgency) {
        return NextResponse.json({ error: 'Target agency not found' }, { status: 404 });
      }

      const firstUser = dbAgency.users[0];

      targetUser = {
        id: firstUser?.id || dbAgency.id,
        name: dbAgency.name,
        email: firstUser?.email || `${dbAgency.id}@agency.nexmove.pk`,
        role: 'AGENCY_MANAGER',
        accountRoleType: 'AGENCY_ADMIN',
        agencyId: dbAgency.id,
        agencyName: dbAgency.name,
        isArchitect: false,
      };

      destinationUrl = '/agency/dashboard';
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'Failed to construct target user context' }, { status: 400 });
    }

    const impersonationPayload = {
      isActive: true,
      targetUser,
      admin: {
        id: session?.user?.id || 'admin',
        email: session?.user?.email || 'nexmove.pk@gmail.com',
        name: session?.user?.name || 'Super Admin',
      },
      destinationUrl,
      startedAt: new Date().toISOString(),
    };

    const cookieStore = cookies();
    cookieStore.set(IMPERSONATION_COOKIE_NAME, encodeURIComponent(JSON.stringify(impersonationPayload)), {
      path: '/',
      httpOnly: false, // Accessible by client components for instant banner rendering
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 4 * 60 * 60, // 4 hours maximum inspection limit
    });

    return NextResponse.json({
      success: true,
      message: `Impersonation started for ${targetUser.name}`,
      destinationUrl,
      targetUser,
    });
  } catch (error) {
    console.error('[Admin Impersonate POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error while starting impersonation' }, { status: 500 });
  }
}

// ── DELETE: Exit impersonation and clear cookie ───────────────────────────────
export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete(IMPERSONATION_COOKIE_NAME);

  return NextResponse.json({
    success: true,
    message: 'Impersonation ended. Returned to Super Admin mode.',
    redirectUrl: '/admin/dashboard',
  });
}
