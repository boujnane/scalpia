import { NextResponse } from "next/server";
import { createPortalSession } from "@/lib/stripe";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = await adminAuth().verifyIdToken(token);
    const userId = decoded.uid;

    const snap = await adminDb().collection("subscriptions").doc(userId).get();
    const stripeCustomerId = snap.exists ? snap.data()?.stripeCustomerId : null;

    if (!stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer ID" }, { status: 404 });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    const returnUrl = `${origin}/pricing`;

    const session = await createPortalSession(stripeCustomerId, returnUrl);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[Stripe Portal] Error:", err);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
