// src/app/api/promotions/active/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get('placement') || 'HOMEPAGE'; // HOMEPAGE, SEARCH_TOP, SIDEBAR
    const city = searchParams.get('city');
    const limit = Math.min(Number(searchParams.get('limit')) || 6, 20);

    const now = new Date();

    const whereClause: Prisma.PromotionWhereInput = {
      status: 'ACTIVE',
      endDate: { gte: now },
      placements: { has: placement },
    };

    if (city) {
      whereClause.entityCity = { contains: city, mode: 'insensitive' };
    }

    const promotions = await prisma.promotion.findMany({
      where: whereClause,
      orderBy: [
        { budgetPKR: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Extract entity IDs to track impressions
    const promoIds = promotions.map((p) => p.id);

    return NextResponse.json({
      success: true,
      promotions,
      count: promotions.length,
      promoIds,
    });
  } catch (error: unknown) {
    console.error('[Active Promotions API Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
