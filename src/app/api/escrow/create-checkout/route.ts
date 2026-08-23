// src/app/api/escrow/create-checkout/route.ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rawKey = process.env.STRIPE_SECRET_KEY || '';
    const cleanKey = rawKey.replace(/[^a-zA-Z0-9_]/g, '').trim();

    const body = await req.json();
    const {
      propertyId,
      propertyTitle = 'NexMove Property Reservation',
      tokenAmount,
      buyerName = 'Buyer',
      buyerPhone = '',
      buyerEmail,
    } = body;

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const numericTokenAmount = Number(tokenAmount);
    if (!numericTokenAmount || isNaN(numericTokenAmount) || numericTokenAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid token deposit amount is required' },
        { status: 400 }
      );
    }

    // Determine host origin for success/cancel redirects
    const origin =
      req.headers.get('origin') ||
      (req.headers.get('host') ? `http://${req.headers.get('host')}` : '') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    const successUrl = `${origin}/marketplace/${propertyId}?status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/marketplace/${propertyId}?status=cancelled`;

    // Attempt real Stripe checkout if a key is configured
    if (cleanKey && cleanKey.startsWith('sk_test_')) {
      try {
        const stripe = new Stripe(cleanKey, {
          apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
        });

        // managed_payments: { enabled: false } disables Managed Payments on this account
        // allowing standard payment_method_types to be used without tax_code requirements.
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const sessionParams: Record<string, unknown> = {
          mode: 'payment',
          payment_method_types: ['card'],
          managed_payments: { enabled: false },
          customer_email:
            buyerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail) ? buyerEmail : undefined,
          line_items: [
            {
              price_data: {
                currency: 'pkr',
                product_data: {
                  name: `NexMove Escrow Token: ${propertyTitle}`,
                  description: `5% Non-Refundable Token Deposit for Property ID: ${propertyId}. Held in NexMove Escrow Vault.`,
                },
                unit_amount: Math.round(numericTokenAmount * 100),
              },
              quantity: 1,
            },
          ],
          metadata: {
            propertyId: String(propertyId),
            buyerName: String(buyerName),
            buyerPhone: String(buyerPhone),
            propertyTitle: String(propertyTitle),
            tokenAmount: String(numericTokenAmount),
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
        };
        /* eslint-enable @typescript-eslint/no-explicit-any */

        const session = await stripe.checkout.sessions.create(
          sessionParams as Stripe.Checkout.SessionCreateParams
        );

        // Record buyer token payment in Supabase & Prisma Deals table
        try {
          const { supabase } = await import('@/lib/supabaseClient');
          const { prisma } = await import('@/lib/prisma');

          const firstAgency = await prisma.agency.findFirst({ select: { id: true } }).catch(() => null);
          const firstAgent = await prisma.user.findFirst({ select: { id: true } }).catch(() => null);

          if (firstAgency && firstAgent) {
            await prisma.deal.create({
              data: {
                listingId: String(propertyId),
                agencyId: firstAgency.id,
                sellerAgentId: firstAgent.id,
                status: 'ESCROW',
                tokenAmount: numericTokenAmount,
              },
            }).catch(() => {});
          }

          // Insert into Supabase deals table
          await supabase.from('deals').insert([
            {
              listing_id: String(propertyId),
              token_amount: numericTokenAmount,
              buyer_name: String(buyerName),
              buyer_phone: String(buyerPhone),
              buyer_email: buyerEmail || null,
              status: 'ESCROW',
              stripe_session_id: session.id,
              created_at: new Date().toISOString(),
            },
          ]);
        } catch (dealErr) {
          console.warn('[Escrow Checkout] Non-blocking deal recording note:', dealErr);
        }

        if (session.url) {
          return NextResponse.json({
            success: true,
            url: session.url,
            sessionId: session.id,
          });
        }
      } catch (stripeError: unknown) {
        const stripeMsg = stripeError instanceof Error ? stripeError.message : '';
        console.error('[Stripe Escrow Checkout Error from Stripe API]:', stripeMsg);

        return NextResponse.json(
          {
            success: false,
            error: `Stripe API: ${stripeMsg}`,
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Missing or invalid STRIPE_SECRET_KEY in .env. Please configure your active Stripe test key.',
      },
      { status: 500 }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create Stripe Escrow checkout session';
    console.error('[Stripe Escrow Checkout] Error creating session:', error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
