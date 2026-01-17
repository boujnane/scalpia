import { NextResponse } from "next/server"
import {
  STRIPE_PRICE_IDS,
  getOrCreateCustomer,
  createCheckoutSession,
  BillingInterval,
  stripe,
} from "@/lib/stripe"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { interval } = (await req.json().catch(() => ({}))) as {
      interval?: BillingInterval
    }

    if (!interval || !["monthly", "yearly"].includes(interval)) {
      return NextResponse.json({ error: "Invalid interval" }, { status: 400 })
    }

    const priceId = STRIPE_PRICE_IDS[interval]
    if (!priceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 500 })
    }

    // ✅ Verify Firebase user from token
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = await adminAuth().verifyIdToken(token)
    const userId = decoded.uid
    const email = decoded.email
    if (!email) return NextResponse.json({ error: "Email missing on token" }, { status: 400 })

    // ✅ Get/Create customer (robust)
    let customerId = await getOrCreateCustomer(userId, email)

    // ✅ Check active subs — and auto-repair if customer was deleted in Stripe
    try {
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
      })

      if (existingSubscriptions.data.length > 0) {
        // Option A: block
        return NextResponse.json({ error: "Already subscribed" }, { status: 400 })

        // Option B (better UX): return { redirect: "portal" } and redirect client-side
        // return NextResponse.json({ error: "Already subscribed", redirect: "portal" }, { status: 400 })
      }
    } catch (err: any) {
      // If customer doesn't exist (you deleted it from Stripe), recreate
      if (err?.code === "resource_missing" && String(err?.message || "").includes("No such customer")) {
        customerId = null as any // force Stripe to create a new one in checkout
      } else {
        throw err
      }
    }

    // Store customer id only if we have one (if null, webhook will populate after checkout)
    if (customerId) {
      await adminDb().collection("subscriptions").doc(userId).set(
        { stripeCustomerId: customerId, updatedAt: new Date() },
        { merge: true }
      )
    }

    const origin = req.headers.get("origin") || "http://localhost:3000"
    const successUrl = `${origin}/pricing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${origin}/pricing`

    // ✅ NEW signature
    const session = await createCheckoutSession({
      customerId: customerId ?? null, // if null => Stripe creates customer
      priceId,
      userId,
      successUrl,
      cancelUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[Stripe Checkout] Error:", err)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
