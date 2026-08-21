// src/lib/stripe.ts
import Stripe from 'stripe';

export function getCleanStripeSecretKey(): string {
  const rawKey = process.env.STRIPE_SECRET_KEY || '';
  return rawKey.replace(/[^a-zA-Z0-9_]/g, '').trim();
}

export function createStripeClient(key?: string): Stripe {
  const cleanKey = key || getCleanStripeSecretKey();
  if (!cleanKey || !cleanKey.startsWith('sk_test_')) {
    throw new Error('Invalid Stripe Secret Key configuration.');
  }

  return new Stripe(cleanKey, {
    apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
    typescript: true,
  });
}
