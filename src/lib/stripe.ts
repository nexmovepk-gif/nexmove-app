// src/lib/stripe.ts
import Stripe from 'stripe';

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY ||
  'sk_test_51U6wuc1Hife0dd70yuEg7PbDINulnYn2oHuJ6Ex40jy4q8gLhq5f48vgcmDcLNEPhnGfdVswtjjjMBUykNjmsrHq00IxqJpQLj';

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(stripeSecretKey, {
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe = getStripe();
