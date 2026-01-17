// app/api/stripe/checkout/route.ts
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

function getBaseUrl(req: Request) {
  // origin peut être null en prod (proxy/vercel). Donc fallback env.
  const origin = req.headers.get("origin")
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  return origin || siteUrl || "https://pokeindex.fr"
}

export async function POST(req: Request) {
  try {
    const { interval } = (await req.json().catch(() => ({}))) as {
      interval?: BillingInterval
    }

    if (interval !== "monthly" && interval !== "yearly") {
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
    let customerId: string | null = await getOrCreateCustomer(userId, email)

    // ✅ Check active subs — auto-repair if customer was deleted in Stripe
    if (customerId) {
      try {
        const existingSubscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
        })

        if (existingSubscriptions.data.length > 0) {
          return NextResponse.json({ error: "Already subscribed" }, { status: 400 })
        }
      } catch (err: any) {
        const msg = String(err?.message || "")
        if (err?.code === "resource_missing" || msg.includes("No such customer")) {
          customerId = null // => Stripe créera un customer pendant checkout
        } else {
          throw err
        }
      }
    }

    // Store customer id only if we have one (if null, webhook can store later)
    if (customerId) {
      await adminDb().collection("subscriptions").doc(userId).set(
        { stripeCustomerId: customerId, updatedAt: new Date() },
        { merge: true }
      )
    }

    const baseUrl = getBaseUrl(req)
    const successUrl = `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/pricing`

    // ✅ createCheckoutSession signature = params object
    const session = await createCheckoutSession({
      customerId, // string | null
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
