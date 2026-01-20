// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type UserWithSubscription = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string | null;
  lastSignIn: string | null;
  tier: "free" | "pro" | "admin";
  subscriptionCreatedAt: string | null;
  subscriptionExpiresAt: string | null;
  stripeCustomerId: string | null;
};

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'appelant est admin
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth().verifyIdToken(token);

    const isAdmin = decoded.admin === true;

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // Lister tous les utilisateurs Firebase Auth
    const listUsersResult = await adminAuth().listUsers(1000); // max 1000 users

    // Récupérer toutes les subscriptions
    const subscriptionsSnap = await adminDb().collection("subscriptions").get();
    const subscriptionsMap = new Map<string, any>();

    subscriptionsSnap.docs.forEach((doc) => {
      subscriptionsMap.set(doc.id, doc.data());
    });

    // Fusionner les données
    const users: UserWithSubscription[] = listUsersResult.users.map((user) => {
      const sub = subscriptionsMap.get(user.uid);

      // Parse les timestamps Firestore
      const parseTimestamp = (val: any): string | null => {
        if (!val) return null;
        if (val.toDate) return val.toDate().toISOString();
        if (val instanceof Date) return val.toISOString();
        return null;
      };

      return {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        createdAt: user.metadata.creationTime || null,
        lastSignIn: user.metadata.lastSignInTime || null,
        tier: sub?.tier || "free",
        subscriptionCreatedAt: parseTimestamp(sub?.createdAt),
        subscriptionExpiresAt: parseTimestamp(sub?.expiresAt),
        stripeCustomerId: sub?.stripeCustomerId || null,
      };
    });

    // Trier: admin en premier, puis pro, puis free, puis par date de création
    users.sort((a, b) => {
      const tierRank = (t: string) => (t === "admin" ? 0 : t === "pro" ? 1 : 2);
      const rankDiff = tierRank(a.tier) - tierRank(b.tier);
      if (rankDiff !== 0) return rankDiff;

      // Puis par date de création (plus récent en premier)
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });

    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    console.error("[Admin Users] Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// PATCH - Modifier le tier d'un utilisateur
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth().verifyIdToken(token);

    const isAdmin = decoded.admin === true;

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { uid, tier } = body as { uid: string; tier: "free" | "pro" };

    if (!uid || !tier || !["free", "pro"].includes(tier)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Ne pas permettre de modifier son propre compte ou un admin
    if (uid === decoded.uid) {
      return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
    }

    const targetDoc = await adminDb().collection("subscriptions").doc(uid).get();
    if (targetDoc.exists && targetDoc.data()?.tier === "admin") {
      return NextResponse.json({ error: "Cannot modify admin accounts" }, { status: 400 });
    }

    // Mettre à jour ou créer le document
    await adminDb().collection("subscriptions").doc(uid).set(
      {
        tier,
        updatedAt: new Date(),
        // Si on passe à free, on peut supprimer l'expiration
        ...(tier === "free" ? { expiresAt: null } : {}),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, uid, tier });
  } catch (error) {
    console.error("[Admin Users PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
