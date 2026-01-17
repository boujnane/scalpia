import { NextResponse } from "next/server";
import {
  STRIPE_PRICE_IDS,
  getOrCreateCustomer,
  createCheckoutSession,
  BillingInterval,
  stripe,
} from "@/lib/stripe";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { interval } = (await req.json().catch(() => ({}))) as {
      interval: BillingInterval;
    };

    if (!interval || !["monthly", "yearly"].includes(interval)) {
      return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
    }

    const priceId = STRIPE_PRICE_IDS[interval];
    if (!priceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 500 });
    }

    // ✅ Verify Firebase user from token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth().verifyIdToken(token);
    const userId = decoded.uid;
    const email = decoded.email;
    if (!email) return NextResponse.json({ error: "Email missing on token" }, { status: 400 });

    // Stripe customer
    const customerId = await getOrCreateCustomer(userId, email);

    // Optional: block if already active
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });
    if (existingSubscriptions.data.length > 0) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 });
    }

    // store customer id (server-side, admin)
    await adminDb().collection("subscriptions").doc(userId).set(
      { stripeCustomerId: customerId, updatedAt: new Date() },
      { merge: true }
    );

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const successUrl = `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing`;

    const session = await createCheckoutSession(
      customerId,
      priceId,
      userId,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[Stripe Checkout] Error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
