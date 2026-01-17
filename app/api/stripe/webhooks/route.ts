import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe, constructWebhookEvent } from "@/lib/stripe"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

export const runtime = "nodejs"

type Tier = "free" | "pro"

// -------------------------
// Helpers (safe ids + periods)
// -------------------------

function getId(val: unknown): string | null {
  if (!val) return null
  if (typeof val === "string") return val
  if (typeof val === "object" && val !== null && "id" in val) {
    const id = (val as any).id
    return typeof id === "string" ? id : null
  }
  return null
}

/**
 * Stripe >= 2025: period fields moved to subscription items.
 * Use subscription.items.data[0].current_period_end
 */
function getItemPeriodEndSeconds(subscription: Stripe.Subscription): number | null {
  const item0 = (subscription as any)?.items?.data?.[0]
  const sec = item0?.current_period_end
  return typeof sec === "number" && Number.isFinite(sec) ? sec : null
}

function toTimestampFromSeconds(sec: number | null): Timestamp | null {
  if (sec == null) return null
  return Timestamp.fromMillis(Math.floor(sec) * 1000)
}

/**
 * invoice.subscription is not typed on some SDK typings depending on apiVersion.
 * We read it safely.
 */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const raw = (invoice as any)?.subscription
  return getId(raw)
}

// -------------------------
// Firestore
// -------------------------

async function updateSubscriptionInFirestore(params: {
  userId: string
  tier: Tier
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  expiresAt: Timestamp | null
}) {
  const { userId, tier, stripeCustomerId, stripeSubscriptionId, expiresAt } = params

  const ref = adminDb().collection("subscriptions").doc(userId)

  await ref.set(
    {
      tier,
      stripeCustomerId: stripeCustomerId ?? null,
      stripeSubscriptionId: stripeSubscriptionId ?? null,
      expiresAt: expiresAt ?? null,
      updatedAt: FieldValue.serverTimestamp(),
      ...(tier === "pro" ? { createdAt: FieldValue.serverTimestamp() } : {}),
    },
    { merge: true }
  )
}

// -------------------------
// Stripe handlers
// -------------------------

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.firebaseUserId
  if (!userId) {
    console.error("[Webhook] Missing firebaseUserId in session metadata")
    return
  }

  const customerId = getId(session.customer)
  const subscriptionId = getId(session.subscription)

  if (!subscriptionId) {
    console.error("[Webhook] Missing subscription id on checkout session")
    return
  }

  // expand items to ensure items.data is present
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  })

  const periodEndSec = getItemPeriodEndSeconds(subscription)
  const expiresAt = toTimestampFromSeconds(periodEndSec)

  console.log("[Webhook] checkout.session.completed sub.status =", (subscription as any).status)
  console.log("[Webhook] checkout.session.completed item.current_period_end =", periodEndSec)

  if (!expiresAt) {
    console.error("[Webhook] Missing item.current_period_end on subscription", subscriptionId)
    console.log("[Webhook] Subscription item keys:", Object.keys((subscription as any)?.items?.data?.[0] ?? {}))
    return
  }

  console.log(`[Webhook] checkout.session.completed -> PRO for ${userId}`)

  await updateSubscriptionInFirestore({
    userId,
    tier: "pro",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    expiresAt,
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.firebaseUserId
  if (!userId) {
    console.error("[Webhook] Missing firebaseUserId in subscription metadata")
    return
  }

  const customerId = getId(subscription.customer)
  const subscriptionId = subscription.id

  const isActive = ["active", "trialing"].includes(subscription.status)
  const tier: Tier = isActive ? "pro" : "free"

  const periodEndSec = getItemPeriodEndSeconds(subscription)
  const expiresAt = isActive ? toTimestampFromSeconds(periodEndSec) : null

  console.log(`[Webhook] customer.subscription.updated -> ${tier} for ${userId} (status=${subscription.status})`)
  console.log("[Webhook] item.current_period_end =", periodEndSec)

  await updateSubscriptionInFirestore({
    userId,
    tier,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    expiresAt,
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.firebaseUserId
  if (!userId) {
    console.error("[Webhook] Missing firebaseUserId in subscription metadata")
    return
  }

  console.log(`[Webhook] customer.subscription.deleted -> FREE for ${userId}`)

  await updateSubscriptionInFirestore({
    userId,
    tier: "free",
    stripeCustomerId: getId(subscription.customer),
    stripeSubscriptionId: subscription.id,
    expiresAt: null,
  })
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  })

  const userId = (subscription as any)?.metadata?.firebaseUserId as string | undefined
  if (!userId) {
    console.error("[Webhook] Missing firebaseUserId on subscription (invoice.payment_succeeded)")
    return
  }

  const customerId = getId(subscription.customer)
  const periodEndSec = getItemPeriodEndSeconds(subscription)
  const expiresAt = toTimestampFromSeconds(periodEndSec)

  console.log(`[Webhook] invoice.payment_succeeded -> sub.status=${(subscription as any).status}`)
  console.log("[Webhook] item.current_period_end =", periodEndSec)

  if (!expiresAt) {
    console.error("[Webhook] Missing item.current_period_end (invoice.payment_succeeded)", subscriptionId)
    return
  }

  await updateSubscriptionInFirestore({
    userId,
    tier: "pro",
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    expiresAt,
  })
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = (subscription as any)?.metadata?.firebaseUserId as string | undefined

  if (!userId) {
    console.error("[Webhook] Missing firebaseUserId (invoice.payment_failed)")
    return
  }

  console.log(`[Webhook] invoice.payment_failed for ${userId} (sub=${subscriptionId})`)
}

// -------------------------
// Webhook entrypoint
// -------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("stripe-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
    }

    let event: Stripe.Event
    try {
      event = constructWebhookEvent(body, signature)
    } catch (err) {
      console.error("[Webhook] Signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    console.log(`[Webhook] Event received: ${event.type}`)

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        // ok to ignore noisy events
        console.log(`[Webhook] Unhandled event: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Webhook] Fatal error", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}
