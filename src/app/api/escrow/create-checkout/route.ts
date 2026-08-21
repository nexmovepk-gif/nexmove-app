// src/app/api/escrow/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      propertyId,
      propertyTitle = 'NexMove Property Reservation',
      tokenAmount,
      buyerName,
      buyerPhone,
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

    // Create Stripe Checkout Session in 'payment' mode
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: buyerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail) ? buyerEmail : undefined,
      line_items: [
        {
          price_data: {
            currency: 'pkr',
            product_data: {
              name: `NexMove Escrow Token: ${propertyTitle}`,
              description: `5% Non-Refundable Token Deposit for Property ID: ${propertyId}. Held in NexMove Escrow Vault.`,
            },
            unit_amount: Math.round(numericTokenAmount * 100), // PKR in paisas
          },
          quantity: 1,
        },
      ],
      metadata: {
        propertyId: String(propertyId),
        buyerName: String(buyerName || 'Anonymous Buyer'),
        buyerPhone: String(buyerPhone || ''),
        propertyTitle: String(propertyTitle),
        tokenAmount: String(numericTokenAmount),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      throw new Error('Failed to generate Stripe Checkout URL');
    }

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create Stripe Escrow checkout session';
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
