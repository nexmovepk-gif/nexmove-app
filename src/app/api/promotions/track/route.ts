// src/app/api/promotions/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { promotionIds, type } = body; // type: 'view' | 'click' | 'search_impression'

    if (!Array.isArray(promotionIds) || promotionIds.length === 0) {
      return NextResponse.json({ success: true });
    }

    // Increment metrics in background
    if (type === 'view') {
      await prisma.promotion.updateMany({
        where: { id: { in: promotionIds } },
        data: { viewsCount: { increment: 1 } },
      });
    } else if (type === 'click') {
      await prisma.promotion.updateMany({
        where: { id: { in: promotionIds } },
        data: { clicksCount: { increment: 1 } },
      });
    } else if (type === 'search_impression') {
      await prisma.promotion.updateMany({
        where: { id: { in: promotionIds } },
        data: { searchImpressions: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.warn('[Promotions Tracking Warning]:', error);
    return NextResponse.json({ success: true }); // non-blocking for frontend
  }
}
