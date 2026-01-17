// lib/stripe.ts
import Stripe from "stripe";

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// Price IDs from environment
export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
} as const;

export type BillingInterval = keyof typeof STRIPE_PRICE_IDS;

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string
): Promise<string> {
  // Search for existing customer with this userId in metadata
  const existingCustomers = await stripe.customers.search({
    query: `metadata['firebaseUserId']:'${userId}'`,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      firebaseUserId: userId,
    },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout Session for subscription
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        firebaseUserId: userId,
      },
    },
    metadata: {
      firebaseUserId: userId,
    },
  });
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
