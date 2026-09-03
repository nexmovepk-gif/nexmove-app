// src/app/api/admin/promotions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/client';

export const dynamic = 'force-dynamic';

function isSuperAdmin(session: unknown): boolean {
  const sess = session as { user?: { role?: string; email?: string } } | null;
  return (
    sess?.user?.role === 'SUPER_ADMIN' ||
    sess?.user?.email?.toLowerCase() === 'nexmove.pk@gmail.com'
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const where: Prisma.PromotionWhereInput = {};
    if (statusFilter && statusFilter !== 'ALL') {
      where.status = statusFilter as unknown as 'PENDING' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'REJECTED';
    }

    const promotions = await prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    let totalAdRevenuePKR = 0;
    let activeAds = 0;
    let pendingAds = 0;
    let totalViews = 0;
    let totalClicks = 0;

    promotions.forEach((p) => {
      if (p.status === 'ACTIVE' || p.status === 'EXPIRED') {
        totalAdRevenuePKR += p.budgetPKR || 0;
      }
      if (p.status === 'ACTIVE') activeAds++;
      if (p.status === 'PENDING') pendingAds++;
      totalViews += p.viewsCount || 0;
      totalClicks += p.clicksCount || 0;
    });

    return NextResponse.json({
      success: true,
      promotions,
      stats: {
        totalAds: promotions.length,
        activeAds,
        pendingAds,
        totalAdRevenuePKR,
        totalViews,
        totalClicks,
      },
    });
  } catch (error: unknown) {
    console.error('[Admin Promotions GET Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { promotionId, status, extendDays, adminNote } = body;

    if (!promotionId) {
      return NextResponse.json({ error: 'Promotion ID is required' }, { status: 400 });
    }

    const promo = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promo) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }

    const updateData: Prisma.PromotionUpdateInput = {};

    if (status) {
      updateData.status = status;
      if (status === 'ACTIVE' && !promo.startDate) {
        updateData.startDate = new Date();
        updateData.endDate = new Date(Date.now() + (promo.durationDays || 7) * 24 * 60 * 60 * 1000);
      }
    }

    if (extendDays) {
      const currentEnd = promo.endDate ? new Date(promo.endDate) : new Date();
      updateData.endDate = new Date(currentEnd.getTime() + Number(extendDays) * 24 * 60 * 60 * 1000);
      updateData.status = 'ACTIVE';
      updateData.durationDays = (promo.durationDays || 0) + Number(extendDays);
    }

    if (adminNote !== undefined) {
      updateData.adminNote = adminNote;
    }

    const updated = await prisma.promotion.update({
      where: { id: promotionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      promotion: updated,
      message: `Promotion ${promotionId} updated by Super Admin.`,
    });
  } catch (error: unknown) {
    console.error('[Admin Promotions PATCH Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized: Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const promotionId = searchParams.get('id');

    if (!promotionId) {
      return NextResponse.json({ error: 'Promotion ID is required' }, { status: 400 });
    }

    await prisma.promotion.delete({
      where: { id: promotionId },
    });

    return NextResponse.json({
      success: true,
      message: `Promotion ${promotionId} permanently deleted from platform.`,
    });
  } catch (error: unknown) {
    console.error('[Admin Promotions DELETE Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
