// lib/stripe.ts
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
})

export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
  yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
} as const

export type BillingInterval = keyof typeof STRIPE_PRICE_IDS

/**
 * Get or create a Stripe customer for a user
 * - Uses metadata firebaseUserId search (robust)
 * - If a customerId is stored elsewhere but deleted in Stripe, we simply recreate cleanly
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string
): Promise<string> {
  // 1) Find by metadata (best source of truth within current Stripe environment)
  const existing = await stripe.customers.search({
    query: `metadata['firebaseUserId']:'${userId}'`,
  })

  if (existing.data.length > 0) {
    const id = existing.data[0].id

    // 2) Safety check: customer might have been deleted very recently
    try {
      await stripe.customers.retrieve(id)
      return id
    } catch (err: any) {
      // If missing, recreate
      if (err?.code !== "resource_missing") throw err
    }
  }

  // 3) Create a new customer
  const customer = await stripe.customers.create({
    email,
    metadata: { firebaseUserId: userId },
  })

  return customer.id
}

/**
 * Create a Stripe Checkout Session for subscription
 * - If you pass a valid customerId: it will use it
 * - If customerId is null/undefined: Stripe will create a customer automatically
 */
export async function createCheckoutSession(
  params: {
    customerId?: string | null
    priceId: string
    userId: string
    successUrl: string
    cancelUrl: string
  }
): Promise<Stripe.Checkout.Session> {
  const { customerId, priceId, userId, successUrl, cancelUrl } = params

  return stripe.checkout.sessions.create({
    mode: "subscription",
    // If customerId is provided, use it; otherwise let Stripe create it
    ...(customerId
      ? { customer: customerId }
      : { customer_creation: "always" as const }),

    line_items: [{ price: priceId, quantity: 1 }],

    success_url: successUrl,
    cancel_url: cancelUrl,

    // Optional (Stripe can infer payment methods)
    // payment_method_types: ["card"],

    subscription_data: {
      metadata: { firebaseUserId: userId },
    },
    metadata: { firebaseUserId: userId },
  })
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
  })
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
  )
}
createCheckoutSession