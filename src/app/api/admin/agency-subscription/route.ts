// src/app/api/admin/agency-subscription/route.ts
// API Route for Super Admin to update an INDIVIDUAL agency's subscription status & end date

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

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!checkSuperAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      agencyId,
      userId,
      subscriptionStatus,
      subscriptionEndDate,
      extensionDays,
      isKycVerified,
      verified,
    } = body;

    // Support updating either an Agency or a User
    if (!agencyId && !userId) {
      return NextResponse.json(
        { error: 'Missing target identifier: agencyId or userId required' },
        { status: 400 }
      );
    }

    // ── Update Agency Subscription ──────────────────────────────────────
    if (agencyId) {
      const existingAgency = await prisma.agency.findUnique({
        where: { id: agencyId },
      });

      if (!existingAgency) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = {};

      if (subscriptionStatus) {
        const validStatuses: SubscriptionStatus[] = ['ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'SUSPENDED'];
        if (!validStatuses.includes(subscriptionStatus)) {
          return NextResponse.json({ error: 'Invalid subscription status' }, { status: 400 });
        }
        updateData.subscriptionStatus = subscriptionStatus;
      }

      if (typeof isKycVerified === 'boolean') {
        updateData.isKycVerified = isKycVerified;
      }

      if (typeof verified === 'boolean') {
        updateData.verified = verified;
      }

      // Handle subscriptionEndDate or extensionDays
      if (typeof extensionDays === 'number' && extensionDays > 0) {
        const baseDate = existingAgency.subscriptionEndDate && existingAgency.subscriptionEndDate > new Date()
          ? new Date(existingAgency.subscriptionEndDate)
          : new Date();
        baseDate.setDate(baseDate.getDate() + extensionDays);
        updateData.subscriptionEndDate = baseDate;
        // Automatically ensure status is ACTIVE if extending
        if (!subscriptionStatus) {
          updateData.subscriptionStatus = 'ACTIVE';
        }
      } else if (subscriptionEndDate !== undefined) {
        updateData.subscriptionEndDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
      }

      const updatedAgency = await prisma.agency.update({
        where: { id: agencyId },
        data: updateData,
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

      // Also cascade update agency users' subscription status if agency is suspended or activated
      if (subscriptionStatus === 'SUSPENDED' || subscriptionStatus === 'ACTIVE') {
        try {
          await prisma.user.updateMany({
            where: { agencyId },
            data: { subscriptionStatus },
          });
        } catch (cascadeErr) {
          console.warn('[Admin Agency Subscription] User cascade error:', cascadeErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Agency "${updatedAgency.name}" subscription updated to ${updatedAgency.subscriptionStatus}`,
        agency: {
          ...updatedAgency,
          subscriptionEndDate: updatedAgency.subscriptionEndDate
            ? updatedAgency.subscriptionEndDate.toISOString()
            : null,
        },
      });
    }

    // ── Update User Subscription ────────────────────────────────────────
    if (userId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = {};

      if (subscriptionStatus) {
        const validStatuses: SubscriptionStatus[] = ['ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'SUSPENDED'];
        if (!validStatuses.includes(subscriptionStatus)) {
          return NextResponse.json({ error: 'Invalid subscription status' }, { status: 400 });
        }
        updateData.subscriptionStatus = subscriptionStatus;
      }

      if (typeof isKycVerified === 'boolean') {
        updateData.isKycVerified = isKycVerified;
      }

      if (typeof extensionDays === 'number' && extensionDays > 0) {
        const baseDate = existingUser.subscriptionEndDate && existingUser.subscriptionEndDate > new Date()
          ? new Date(existingUser.subscriptionEndDate)
          : new Date();
        baseDate.setDate(baseDate.getDate() + extensionDays);
        updateData.subscriptionEndDate = baseDate;
        if (!subscriptionStatus) {
          updateData.subscriptionStatus = 'ACTIVE';
        }
      } else if (subscriptionEndDate !== undefined) {
        updateData.subscriptionEndDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          isKycVerified: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `User "${updatedUser.email}" subscription updated to ${updatedUser.subscriptionStatus}`,
        user: {
          ...updatedUser,
          subscriptionEndDate: updatedUser.subscriptionEndDate
            ? updatedUser.subscriptionEndDate.toISOString()
            : null,
        },
      });
    }

    return NextResponse.json({ error: 'No update performed' }, { status: 400 });
  } catch (error) {
    console.error('[Admin Agency Subscription PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while updating subscription' },
      { status: 500 }
    );
  }
}

// POST alias for compatibility
export { PATCH as POST };
