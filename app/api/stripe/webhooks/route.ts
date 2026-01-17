// app/api/stripe/webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, constructWebhookEvent } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

async function updateSubscriptionInFirestore(
  userId: string,
  tier: "free" | "pro",
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  expiresAt: Date | null
) {
  const db = adminDb();

  await db
    .collection("subscriptions")
    .doc(userId)
    .set(
      {
        tier,
        stripeCustomerId,
        stripeSubscriptionId,
        expiresAt,
        updatedAt: FieldValue.serverTimestamp(),
        ...(tier === "pro"
          ? { createdAt: FieldValue.serverTimestamp() }
          : {}),
      },
      { merge: true }
    );
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.firebaseUserId;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId) {
    console.error("[Webhook] No firebaseUserId in session metadata");
    return;
  }

  // Get the subscription to find the current period end
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  // Access the subscription data from the response
  const currentPeriodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  const expiresAt = new Date(currentPeriodEnd * 1000);

  console.log(`[Webhook] Activating Pro for user ${userId}, expires: ${expiresAt}`);

  await updateSubscriptionInFirestore(
    userId,
    "pro",
    customerId,
    subscriptionId,
    expiresAt
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.firebaseUserId;
  const customerId = subscription.customer as string;

  if (!userId) {
    console.error("[Webhook] No firebaseUserId in subscription metadata");
    return;
  }

  const isActive = ["active", "trialing"].includes(subscription.status);
  const tier = isActive ? "pro" : "free";
  const currentPeriodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;
  const expiresAt = isActive
    ? new Date(currentPeriodEnd * 1000)
    : null;

  console.log(`[Webhook] Subscription updated for user ${userId}: ${tier}`);

  await updateSubscriptionInFirestore(
    userId,
    tier,
    customerId,
    subscription.id,
    expiresAt
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.firebaseUserId;
  const customerId = subscription.customer as string;

  if (!userId) {
    console.error("[Webhook] No firebaseUserId in subscription metadata");
    return;
  }

  console.log(`[Webhook] Subscription deleted for user ${userId}, downgrading to free`);

  await updateSubscriptionInFirestore(
    userId,
    "free",
    customerId,
    subscription.id,
    null
  );
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  // Access the subscription field which may be a string or null
  const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

  if (!subscriptionId) return;

  // Get subscription to find user
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = (subscription as unknown as { metadata?: { firebaseUserId?: string } }).metadata?.firebaseUserId;

  if (!userId) {
    console.error("[Webhook] No firebaseUserId in subscription metadata");
    return;
  }

  console.log(`[Webhook] Payment failed for user ${userId}`);

  // Optionally: Send notification, mark account as at-risk, etc.
  // For now, we let Stripe's automatic retry handle it
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error("[Webhook] Signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
