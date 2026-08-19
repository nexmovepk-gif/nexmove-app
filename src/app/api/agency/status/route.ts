// src/app/api/agency/status/route.ts
// Returns real-time subscription status, remaining days, KYC verification, and lockout status for current agency

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateRemainingDays, isSubscriptionExpiringSoon, isSubscriptionLocked } from '@/types/subscription';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const agencyId = session.user.agencyId;

    let agency = null;
    let user = null;

    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isKycVerified: true,
          isOverseasVerified: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
        },
      });
    }

    if (agencyId) {
      agency = await prisma.agency.findUnique({
        where: { id: agencyId },
        select: {
          id: true,
          name: true,
          licenseNumber: true,
          verified: true,
          isKycVerified: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
        },
      });
    }

    // Determine authoritative status: Agency status takes priority for agency users, fallback to user status
    const effectiveStatus = agency?.subscriptionStatus || user?.subscriptionStatus || 'ACTIVE';
    const effectiveEndDate = agency?.subscriptionEndDate || user?.subscriptionEndDate || null;
    const isKycVerified = Boolean(agency?.isKycVerified || agency?.verified || user?.isKycVerified || user?.isOverseasVerified);

    const remainingDays = calculateRemainingDays(effectiveEndDate);
    const expiringSoon = isSubscriptionExpiringSoon(effectiveStatus, effectiveEndDate, 5);
    const isLocked = isSubscriptionLocked(effectiveStatus, effectiveEndDate);

    return NextResponse.json({
      success: true,
      subscription: {
        status: effectiveStatus,
        endDate: effectiveEndDate ? effectiveEndDate.toISOString() : null,
        remainingDays,
        expiringSoon,
        isLocked,
        isKycVerified,
      },
      agency: agency
        ? {
            id: agency.id,
            name: agency.name,
            licenseNumber: agency.licenseNumber,
            verified: agency.verified,
            isKycVerified: agency.isKycVerified,
            subscriptionStatus: agency.subscriptionStatus,
            subscriptionEndDate: agency.subscriptionEndDate ? agency.subscriptionEndDate.toISOString() : null,
          }
        : null,
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isKycVerified: user.isKycVerified || user.isOverseasVerified,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionEndDate: user.subscriptionEndDate ? user.subscriptionEndDate.toISOString() : null,
          }
        : null,
    });
  } catch (error) {
    console.error('[Agency Status GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription status' }, { status: 500 });
  }
}
