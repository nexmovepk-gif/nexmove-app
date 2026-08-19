// src/app/api/admin/users-agencies/route.ts
// Real-time Database Search & Filter API for Super Admin User & Agency Management

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@/generated/client/enums';

function checkSuperAdmin(session: { user?: { role?: string | null; email?: string | null } } | null): boolean {
  return (
    session?.user?.role === 'SUPER_ADMIN' ||
    session?.user?.email?.toLowerCase() === 'nexmove.pk@gmail.com'
  );
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!checkSuperAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const roleFilter = searchParams.get('role')?.toUpperCase() || 'ALL';
    const statusFilter = searchParams.get('subscriptionStatus')?.toUpperCase() || 'ALL';

    // ── Build Agency Query ─────────────────────────────────────────
    const agencyWhere: Record<string, unknown> = {};

    if (statusFilter !== 'ALL' && ['ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'SUSPENDED'].includes(statusFilter)) {
      agencyWhere.subscriptionStatus = statusFilter as SubscriptionStatus;
    }

    if (search) {
      agencyWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // ── Build User Query ───────────────────────────────────────────
    const userWhere: Record<string, unknown> = {};

    if (statusFilter !== 'ALL' && ['ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'SUSPENDED'].includes(statusFilter)) {
      userWhere.subscriptionStatus = statusFilter as SubscriptionStatus;
    }

    // Role Filtering Logic
    if (roleFilter !== 'ALL') {
      switch (roleFilter) {
        case 'AGENCY':
          userWhere.OR = [
            { role: 'AGENCY_AGENT' },
            { role: 'AGENCY_MANAGER' },
            { accountRoleType: { contains: 'AGENCY', mode: 'insensitive' } },
          ];
          break;
        case 'LOCAL_PUBLIC':
          userWhere.OR = [
            { accountRoleType: 'LOCAL_PUBLIC' },
            { accountRoleType: 'BUYER' },
            { role: 'PUBLIC_USER' },
          ];
          break;
        case 'ARCHITECT':
          userWhere.OR = [
            { architectProfile: { isNot: null } },
            { accountRoleType: { contains: 'ARCHITECT', mode: 'insensitive' } },
          ];
          break;
        case 'OVERSEAS_BUYER':
          userWhere.OR = [
            { accountRoleType: { contains: 'OVERSEAS', mode: 'insensitive' } },
            { isOverseasVerified: true },
          ];
          break;
        default:
          userWhere.role = roleFilter;
          break;
      }
    }

    if (search) {
      const userSearchClause = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { agency: { name: { contains: search, mode: 'insensitive' } } },
      ];

      if (userWhere.OR) {
        userWhere.AND = [{ OR: userWhere.OR }, { OR: userSearchClause }];
        delete userWhere.OR;
      } else {
        userWhere.OR = userSearchClause;
      }
    }

    // Execute parallel DB queries
    const [agencies, users, totalAgenciesCount, totalUsersCount] = await Promise.all([
      // Only fetch agencies if role is ALL or AGENCY
      roleFilter === 'ALL' || roleFilter === 'AGENCY'
        ? prisma.agency.findMany({
            where: agencyWhere,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              licenseNumber: true,
              phone: true,
              address: true,
              verified: true,
              isKycVerified: true,
              subscriptionStatus: true,
              subscriptionEndDate: true,
              createdAt: true,
              _count: { select: { users: true, listings: true } },
            },
          })
        : Promise.resolve([]),

      prisma.user.findMany({
        where: userWhere,
        orderBy: { createdAt: 'desc' },
        take: 150,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          accountRoleType: true,
          isKycVerified: true,
          isOverseasVerified: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
          agencyId: true,
          agency: {
            select: { id: true, name: true, subscriptionStatus: true },
          },
          architectProfile: {
            select: { id: true, name: true, specialization: true, isVerified: true },
          },
          createdAt: true,
        },
      }),

      prisma.agency.count(),
      prisma.user.count(),
    ]);

    // Format formatted responses
    const formattedAgencies = agencies.map((a) => ({
      id: a.id,
      name: a.name,
      licenseNumber: a.licenseNumber,
      phone: a.phone,
      address: a.address,
      verified: a.verified,
      isKycVerified: a.isKycVerified,
      subscriptionStatus: a.subscriptionStatus,
      subscriptionEndDate: a.subscriptionEndDate ? a.subscriptionEndDate.toISOString() : null,
      userCount: a._count.users,
      listingCount: a._count.listings,
      createdAt: a.createdAt.toISOString(),
    }));

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      accountRoleType: u.accountRoleType,
      isKycVerified: u.isKycVerified || u.isOverseasVerified,
      subscriptionStatus: u.subscriptionStatus,
      subscriptionEndDate: u.subscriptionEndDate ? u.subscriptionEndDate.toISOString() : null,
      agencyId: u.agencyId,
      agencyName: u.agency?.name || null,
      architectProfile: u.architectProfile || null,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalAgencies: totalAgenciesCount,
        totalUsers: totalUsersCount,
        filteredAgencies: formattedAgencies.length,
        filteredUsers: formattedUsers.length,
      },
      agencies: formattedAgencies,
      users: formattedUsers,
    });
  } catch (error) {
    console.error('[Admin Users & Agencies GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while searching database' },
      { status: 500 }
    );
  }
}
