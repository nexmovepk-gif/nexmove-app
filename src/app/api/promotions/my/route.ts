// src/app/api/promotions/my/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type PromotionWhere = NonNullable<NonNullable<Parameters<typeof prisma.promotion.findMany>[0]>['where']>;

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const agencyId = session?.user?.agencyId;
    const userEmail = session?.user?.email;

    if (!userId && !agencyId && !userEmail) {
      return NextResponse.json({
        success: true,
        promotions: [],
        metrics: {
          activeCount: 0,
          pendingCount: 0,
          pausedCount: 0,
          expiredCount: 0,
          totalViews: 0,
          totalClicks: 0,
          totalSearchImpressions: 0,
          totalSpendPKR: 0,
        },
      });
    }

    const orConditions: PromotionWhere[] = [];
    if (agencyId) orConditions.push({ agencyId }, { ownerId: agencyId });
    if (userId) orConditions.push({ userId }, { ownerId: userId });
    if (userEmail) orConditions.push({ ownerEmail: userEmail });

    // Auto-update expired status before fetching
    const now = new Date();
    try {
      await prisma.promotion.updateMany({
        where: {
          status: 'ACTIVE',
          endDate: { lt: now },
        },
        data: {
          status: 'EXPIRED',
        },
      });
    } catch {
      /* ignore auto-expire errors */
    }

    const promotions = await prisma.promotion.findMany({
      where: orConditions.length > 0 ? { OR: orConditions } : {},
      orderBy: { createdAt: 'desc' },
    });

    let activeCount = 0;
    let pendingCount = 0;
    let pausedCount = 0;
    let expiredCount = 0;
    let totalViews = 0;
    let totalClicks = 0;
    let totalSearchImpressions = 0;
    let totalSpendPKR = 0;

    const formattedPromotions = promotions.map((p) => {
      if (p.status === 'ACTIVE') activeCount++;
      else if (p.status === 'PENDING') pendingCount++;
      else if (p.status === 'PAUSED') pausedCount++;
      else if (p.status === 'EXPIRED') expiredCount++;

      totalViews += p.viewsCount || 0;
      totalClicks += p.clicksCount || 0;
      totalSearchImpressions += p.searchImpressions || 0;
      if (p.status === 'ACTIVE' || p.status === 'EXPIRED') {
        totalSpendPKR += p.budgetPKR || 0;
      }

      // Calculate remaining hours and days
      let remainingDays = 0;
      let remainingHours = 0;
      let isExpiringSoon = false;

      if (p.endDate && p.status === 'ACTIVE') {
        const diffMs = new Date(p.endDate).getTime() - now.getTime();
        if (diffMs > 0) {
          remainingDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          remainingHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          if (remainingDays <= 2) isExpiringSoon = true;
        }
      }

      return {
        ...p,
        remainingDays,
        remainingHours,
        isExpiringSoon,
      };
    });

    return NextResponse.json({
      success: true,
      promotions: formattedPromotions,
      metrics: {
        activeCount,
        pendingCount,
        pausedCount,
        expiredCount,
        totalViews,
        totalClicks,
        totalSearchImpressions,
        totalSpendPKR,
      },
    });
  } catch (error: unknown) {
    console.error('[My Promotions API Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
