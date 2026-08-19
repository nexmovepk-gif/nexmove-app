// src/app/api/admin/user-status/route.ts
// Direct Super Admin Mutation API for User & Agency Status, Subscription, and KYC Verification

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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
      userId,
      agencyId,
      subscriptionStatus,
      isKycVerified,
      extensionDays,
      subscriptionEndDate,
    } = body;

    if (!userId && !agencyId) {
      return NextResponse.json(
        { error: 'Missing target identifier: userId or agencyId required' },
        { status: 400 }
      );
    }

    // ── Update Agency Status / KYC ───────────────────────────────────────────
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
        if (validStatuses.includes(subscriptionStatus)) {
          updateData.subscriptionStatus = subscriptionStatus;
        }
      }

      if (typeof isKycVerified === 'boolean') {
        updateData.isKycVerified = isKycVerified;
        updateData.verified = isKycVerified;
        updateData.verifiedLicense = isKycVerified;
      }

      if (typeof extensionDays === 'number' && extensionDays > 0) {
        const baseDate = existingAgency.subscriptionEndDate && existingAgency.subscriptionEndDate > new Date()
          ? new Date(existingAgency.subscriptionEndDate)
          : new Date();
        baseDate.setDate(baseDate.getDate() + extensionDays);
        updateData.subscriptionEndDate = baseDate;
        if (!subscriptionStatus) updateData.subscriptionStatus = 'ACTIVE';
      } else if (subscriptionEndDate !== undefined) {
        updateData.subscriptionEndDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
      }

      const updatedAgency = await prisma.agency.update({
        where: { id: agencyId },
        data: updateData,
        select: {
          id: true,
          name: true,
          verified: true,
          verifiedLicense: true,
          isKycVerified: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
        },
      });

      // Cascade update to all users associated with this agency
      try {
        const userCascadeData: Record<string, unknown> = {};
        if (updateData.subscriptionStatus) userCascadeData.subscriptionStatus = updateData.subscriptionStatus;
        if (typeof isKycVerified === 'boolean') userCascadeData.isKycVerified = isKycVerified;
        if (updateData.subscriptionEndDate) userCascadeData.subscriptionEndDate = updateData.subscriptionEndDate;

        if (Object.keys(userCascadeData).length > 0) {
          await prisma.user.updateMany({
            where: { agencyId },
            data: userCascadeData,
          });
        }
      } catch (cascadeErr) {
        console.warn('[Admin User Status] Agency user cascade error:', cascadeErr);
      }

      try {
        revalidatePath('/', 'layout');
        revalidatePath('/agencies');
        revalidatePath('/agency/dashboard');
        revalidatePath('/admin/dashboard');
      } catch (revErr) {
        console.warn('[Admin User Status] Revalidation warning:', revErr);
      }

      return NextResponse.json({
        success: true,
        message: `Agency "${updatedAgency.name}" status updated successfully`,
        agency: {
          ...updatedAgency,
          subscriptionEndDate: updatedAgency.subscriptionEndDate ? updatedAgency.subscriptionEndDate.toISOString() : null,
        },
      });
    }

    // ── Update User Status / KYC ─────────────────────────────────────────────
    if (userId) {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { architectProfile: true },
      });

      if (!existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const updateData: Record<string, unknown> = {};

      if (subscriptionStatus) {
        const validStatuses: SubscriptionStatus[] = ['ACTIVE', 'PENDING_PAYMENT', 'EXPIRED', 'SUSPENDED'];
        if (validStatuses.includes(subscriptionStatus)) {
          updateData.subscriptionStatus = subscriptionStatus;
        }
      }

      if (typeof isKycVerified === 'boolean') {
        updateData.isKycVerified = isKycVerified;
        updateData.isOverseasVerified = isKycVerified;
      }

      if (typeof extensionDays === 'number' && extensionDays > 0) {
        const baseDate = existingUser.subscriptionEndDate && existingUser.subscriptionEndDate > new Date()
          ? new Date(existingUser.subscriptionEndDate)
          : new Date();
        baseDate.setDate(baseDate.getDate() + extensionDays);
        updateData.subscriptionEndDate = baseDate;
        if (!subscriptionStatus) updateData.subscriptionStatus = 'ACTIVE';
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
          isOverseasVerified: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
        },
      });

      // If user has an architect profile, sync verification status
      if (existingUser.architectProfile && typeof isKycVerified === 'boolean') {
        try {
          await prisma.architectProfile.update({
            where: { id: existingUser.architectProfile.id },
            data: {
              isVerified: isKycVerified,
              status: isKycVerified ? 'APPROVED' : 'PENDING',
              verificationStatus: isKycVerified ? 'VERIFIED' : 'PENDING',
            },
          });
        } catch (archErr) {
          console.warn('[Admin User Status] Architect profile sync warning:', archErr);
        }
      }

      try {
        revalidatePath('/', 'layout');
        revalidatePath('/architects');
        revalidatePath('/architects/dashboard');
        revalidatePath('/dashboard');
        revalidatePath('/admin/dashboard');
      } catch (revErr) {
        console.warn('[Admin User Status] Revalidation warning:', revErr);
      }

      return NextResponse.json({
        success: true,
        message: `User "${updatedUser.email}" status updated successfully`,
        user: {
          ...updatedUser,
          subscriptionEndDate: updatedUser.subscriptionEndDate ? updatedUser.subscriptionEndDate.toISOString() : null,
        },
      });
    }

    return NextResponse.json({ error: 'No update performed' }, { status: 400 });
  } catch (error) {
    console.error('[Admin User Status PATCH] Error:', error);
    return NextResponse.json({ error: 'Internal server error while updating status' }, { status: 500 });
  }
}

export { PATCH as POST };
