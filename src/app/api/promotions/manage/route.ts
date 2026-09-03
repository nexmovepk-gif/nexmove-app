// src/app/api/promotions/manage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type PromotionUpdate = NonNullable<Parameters<typeof prisma.promotion.update>[0]>['data'];

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const agencyId = session?.user?.agencyId;
    const userEmail = session?.user?.email;

    if (!userId && !agencyId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { promotionId, action, placements, extendDays } = body;

    if (!promotionId) {
      return NextResponse.json({ error: 'Promotion ID is required' }, { status: 400 });
    }

    const promo = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promo) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }

    // Security check: owner verification
    const isOwner =
      promo.userId === userId ||
      promo.agencyId === agencyId ||
      promo.ownerId === userId ||
      promo.ownerId === agencyId ||
      promo.ownerEmail === userEmail ||
      session?.user?.role === 'SUPER_ADMIN';

    if (!isOwner) {
      return NextResponse.json({ error: 'You do not own this promotion' }, { status: 403 });
    }

    const updateData: PromotionUpdate = {};

    if (action === 'TOGGLE_PAUSE') {
      if (promo.status === 'ACTIVE') {
        updateData.status = 'PAUSED';
      } else if (promo.status === 'PAUSED') {
        updateData.status = 'ACTIVE';
      }
    } else if (action === 'UPDATE_PLACEMENTS' && Array.isArray(placements)) {
      updateData.placements = placements;
    } else if (action === 'EXTEND' && extendDays) {
      const currentEnd = promo.endDate ? new Date(promo.endDate) : new Date();
      const newEnd = new Date(currentEnd.getTime() + Number(extendDays) * 24 * 60 * 60 * 1000);
      updateData.endDate = newEnd;
      updateData.status = 'ACTIVE';
      updateData.durationDays = (promo.durationDays || 0) + Number(extendDays);
    } else if (action === 'ACTIVATE_DEMO') {
      const startDate = new Date();
      const endDate = new Date(Date.now() + (promo.durationDays || 7) * 24 * 60 * 60 * 1000);
      updateData.status = 'ACTIVE';
      updateData.startDate = startDate;
      updateData.endDate = endDate;
    }

    const updated = await prisma.promotion.update({
      where: { id: promotionId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      promotion: updated,
      message: `Promotion successfully updated (${action}).`,
    });
  } catch (error: unknown) {
    console.error('[Promotion Manage API Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const agencyId = session?.user?.agencyId;
    const userEmail = session?.user?.email;

    const { searchParams } = new URL(req.url);
    const promotionId = searchParams.get('id');

    if (!promotionId) {
      return NextResponse.json({ error: 'Promotion ID is required' }, { status: 400 });
    }

    const promo = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });

    if (!promo) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }

    const isOwner =
      promo.userId === userId ||
      promo.agencyId === agencyId ||
      promo.ownerId === userId ||
      promo.ownerId === agencyId ||
      promo.ownerEmail === userEmail ||
      session?.user?.role === 'SUPER_ADMIN';

    if (!isOwner) {
      return NextResponse.json({ error: 'You do not own this promotion' }, { status: 403 });
    }

    await prisma.promotion.delete({
      where: { id: promotionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Promotion deleted successfully.',
    });
  } catch (error: unknown) {
    console.error('[Promotion Delete API Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
