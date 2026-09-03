// src/app/api/promotions/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const PROMOTION_PACKAGES: Record<string, { days: number; pricePKR: number; label: string }> = {
  BASIC: { days: 7, pricePKR: 1000, label: 'Basic Boost (7 Days)' },
  STANDARD: { days: 15, pricePKR: 1750, label: 'Standard Boost (15 Days)' },
  PREMIUM: { days: 30, pricePKR: 3000, label: 'Premium Featured (30 Days)' },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const {
      type = 'PROPERTY',
      entityId,
      entityTitle,
      entityImage,
      entityCity,
      entityPrice,
      package: selectedPackage = 'BASIC',
      placements = ['HOMEPAGE', 'SEARCH_TOP'],
      autoActivate = false, // Direct test activation option
    } = body;

    if (!entityId || !entityTitle) {
      return NextResponse.json(
        { error: 'Entity ID and Title are required to create a promotion.' },
        { status: 400 }
      );
    }

    const pkgInfo = PROMOTION_PACKAGES[selectedPackage] || PROMOTION_PACKAGES.BASIC;
    const durationDays = pkgInfo.days;
    const budgetPKR = pkgInfo.pricePKR;

    const ownerId = session?.user?.agencyId || session?.user?.id || 'anonymous-user';
    const ownerType = session?.user?.agencyId ? 'AGENCY' : 'USER';
    const ownerName = session?.user?.agencyName || session?.user?.name || 'NexMove Advertiser';
    const ownerEmail = session?.user?.email || null;
    const userId = session?.user?.id || null;
    const agencyId = session?.user?.agencyId || null;

    const startDate = new Date();
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // If autoActivate requested (or test bypass), activate immediately
    if (autoActivate) {
      const promotion = await prisma.promotion.create({
        data: {
          type: type === 'AGENCY_PROFILE' ? 'AGENCY_PROFILE' : 'PROPERTY',
          entityId,
          entityTitle,
          entityImage: entityImage || null,
          entityCity: entityCity || null,
          entityPrice: entityPrice ? Number(entityPrice) : null,
          ownerId,
          ownerType,
          ownerName,
          ownerEmail,
          userId,
          agencyId,
          package: selectedPackage as 'BASIC' | 'STANDARD' | 'PREMIUM',
          durationDays,
          budgetPKR,
          placements,
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      });

      return NextResponse.json({
        success: true,
        promotion,
        message: `Promotion successfully activated for ${durationDays} days!`,
      });
    }

    // Initialize Stripe
    const rawKey = process.env.STRIPE_SECRET_KEY || '';
    const cleanKey = rawKey.replace(/[^a-zA-Z0-9_]/g, '').trim();

    // Create preliminary promotion record with PENDING status
    const promotion = await prisma.promotion.create({
      data: {
        type: type === 'AGENCY_PROFILE' ? 'AGENCY_PROFILE' : 'PROPERTY',
        entityId,
        entityTitle,
        entityImage: entityImage || null,
        entityCity: entityCity || null,
        entityPrice: entityPrice ? Number(entityPrice) : null,
        ownerId,
        ownerType,
        ownerName,
        ownerEmail,
        userId,
        agencyId,
        package: selectedPackage as 'BASIC' | 'STANDARD' | 'PREMIUM',
        durationDays,
        budgetPKR,
        placements,
        status: 'PENDING',
      },
    });

    if (!cleanKey || !cleanKey.startsWith('sk_')) {
      // If Stripe key is missing or not live, activate promotion directly as fallback
      const activated = await prisma.promotion.update({
        where: { id: promotion.id },
        data: {
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      });

      return NextResponse.json({
        success: true,
        promotion: activated,
        message: 'Activated promotion directly (Stripe demo mode).',
      });
    }

    const stripe = new Stripe(cleanKey, { apiVersion: '2023-10-16' as Stripe.LatestApiVersion });
    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://nexmove-app.vercel.app';

    // Stripe accepts PKR amounts in cents (multiply by 100)
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'pkr',
            product_data: {
              name: `NexMove Ad Boost: ${entityTitle}`,
              description: `${pkgInfo.label} — Placements: ${placements.join(', ')}`,
              images: entityImage ? [entityImage] : undefined,
            },
            unit_amount: Math.round(budgetPKR * 100),
          },
          quantity: 1,
        },
      ],
      customer_email: ownerEmail || undefined,
      client_reference_id: promotion.id,
      metadata: {
        promotionId: promotion.id,
        entityId,
        durationDays: String(durationDays),
        budgetPKR: String(budgetPKR),
        ownerType,
      },
      success_url: `${origin}/agency/dashboard?adSuccess=true&promoId=${promotion.id}`,
      cancel_url: `${origin}/agency/dashboard?adCancelled=true`,
    });

    // Update promotion with Stripe session ID
    await prisma.promotion.update({
      where: { id: promotion.id },
      data: {
        stripeSessionId: stripeSession.id,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: stripeSession.url,
      sessionId: stripeSession.id,
      promotionId: promotion.id,
    });
  } catch (error: unknown) {
    console.error('[Promotions Checkout API Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal error processing ad promotion';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
