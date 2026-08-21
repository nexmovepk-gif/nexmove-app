// src/app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseClient } from '@/lib/supabaseStorage';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(bodyText, signature, webhookSecret);
    } else {
      // In development or when webhook secret is omitted, safely parse the JSON payload
      event = JSON.parse(bodyText) as Stripe.Event;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown signature error';
    console.error('[Stripe Webhook] Signature verification failed:', message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const propertyId = session.metadata?.propertyId || '';
      const buyerName = session.metadata?.buyerName || session.customer_details?.name || 'Anonymous Buyer';
      const buyerPhone = session.metadata?.buyerPhone || session.customer_details?.phone || '';
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || session.id;

      const amountTotal = (session.amount_total ?? 0) / 100;
      const escrowRef = `ESC-${paymentIntentId.slice(-8).toUpperCase()}`;

      console.log(`[Stripe Webhook] Processing checkout.session.completed:`, {
        sessionId: session.id,
        paymentIntentId,
        escrowRef,
        propertyId,
        buyerName,
        buyerPhone,
        amountTotal,
        status: 'HELD_IN_ESCROW',
      });

      // 1. Upsert into Supabase database
      const supabase = getSupabaseClient();
      const transactionPayload = {
        stripe_session_id: session.id,
        payment_intent_id: paymentIntentId,
        escrow_reference: escrowRef,
        property_id: propertyId,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        amount: amountTotal,
        currency: session.currency || 'pkr',
        status: 'HELD_IN_ESCROW',
        metadata: session.metadata || {},
        updated_at: new Date().toISOString(),
      };

      try {
        const { error: supabaseError } = await supabase
          .from('escrow_transactions')
          .upsert(transactionPayload, { onConflict: 'stripe_session_id' });

        if (supabaseError) {
          console.warn('[Stripe Webhook] Supabase escrow_transactions notice:', supabaseError.message);
        } else {
          console.log('[Stripe Webhook] Successfully upserted escrow transaction into Supabase!');
        }
      } catch (sbErr) {
        console.warn('[Stripe Webhook] Supabase upsert non-blocking error:', sbErr);
      }

      // 2. Sync / update Prisma Property or Deal status if property exists
      if (propertyId) {
        try {
          // Check if property exists in Property model and update status
          const existingProp = await prisma.property.findUnique({
            where: { id: propertyId },
          });

          if (existingProp) {
            await prisma.property.update({
              where: { id: propertyId },
              data: {
                status: 'LOCKED', // Lock property once token is held in escrow
              },
            });
            console.log(`[Stripe Webhook] Updated Property ${propertyId} status to LOCKED.`);
          }
        } catch (prismaErr) {
          console.warn('[Stripe Webhook] Prisma property update notice:', prismaErr);
        }
      }

      return NextResponse.json({
        received: true,
        status: 'HELD_IN_ESCROW',
        escrowReference: escrowRef,
        paymentIntentId,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal webhook handler error';
    console.error('[Stripe Webhook] Error processing event:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
