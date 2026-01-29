import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { TOKEN_LIMITS } from "@/lib/tokens";
import type { SubscriptionTier } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  try {
    // Vérifier le token d'authentification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth().verifyIdToken(token);

    // Vérifier que l'utilisateur est admin
    if (decoded.admin !== true) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer les données de la requête
    const { uid, tier } = await req.json();

    if (!uid || !tier) {
      return NextResponse.json(
        { error: "UID et tier requis" },
        { status: 400 }
      );
    }

    // Vérifier que le tier est valide
    if (!["free", "pro", "admin"].includes(tier)) {
      return NextResponse.json(
        { error: "Tier invalide" },
        { status: 400 }
      );
    }

    const maxTokens = TOKEN_LIMITS[tier as SubscriptionTier];

    // Reset les tokens dans Firestore
    const tokensRef = adminDb().collection("users").doc(uid).collection("usage").doc("tokens");

    await tokensRef.set({
      tokens: maxTokens,
      maxTokens: maxTokens,
      lastReset: new Date(),
      tier: tier,
    });

    return NextResponse.json({
      success: true,
      tokens: maxTokens,
      tier: tier,
    });
  } catch (error) {
    console.error("Error resetting tokens:", error);
    return NextResponse.json(
      { error: "Erreur lors du reset des tokens" },
      { status: 500 }
    );
  }
}
