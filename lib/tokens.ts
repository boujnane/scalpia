// lib/tokens.ts
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "./firebase";
import { SubscriptionTier } from "./subscription";

// Limites de jetons par tier
export const TOKEN_LIMITS: Record<SubscriptionTier, number> = {
  free: 15,
  pro: 300,
  admin: Infinity, // Illimité
};

export type UserTokens = {
  tokens: number;
  maxTokens: number;
  lastReset: Date | null;
  tier: SubscriptionTier;
};

export const DEFAULT_TOKENS: UserTokens = {
  tokens: TOKEN_LIMITS.free,
  maxTokens: TOKEN_LIMITS.free,
  lastReset: null,
  tier: "free",
};

/**
 * Vérifie si on doit reset les jetons (nouveau jour)
 */
function shouldResetTokens(lastReset: Date | null): boolean {
  if (!lastReset) return true;

  const now = new Date();
  const resetDate = new Date(lastReset);

  // Reset à minuit (comparaison par jour)
  return (
    now.getFullYear() !== resetDate.getFullYear() ||
    now.getMonth() !== resetDate.getMonth() ||
    now.getDate() !== resetDate.getDate()
  );
}

/**
 * Parse Firestore Timestamp en Date
 */
function parseTimestamp(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === "object" && "toDate" in val && typeof (val as { toDate: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate();
  }
  if (val instanceof Date) return val;
  return null;
}

/**
 * Récupère les jetons de l'utilisateur depuis Firestore
 * Reset automatiquement si nouveau jour
 */
export async function getUserTokens(userId: string, tier: SubscriptionTier): Promise<UserTokens> {
  try {
    const docRef = doc(db, "users", userId, "usage", "tokens");
    const docSnap = await getDoc(docRef);

    const maxTokens = TOKEN_LIMITS[tier];

    if (!docSnap.exists()) {
      // Premier usage - créer le document avec les jetons max
      const newTokens: UserTokens = {
        tokens: maxTokens,
        maxTokens,
        lastReset: new Date(),
        tier,
      };

      await setDoc(docRef, {
        tokens: maxTokens,
        maxTokens,
        lastReset: serverTimestamp(),
        tier,
      });

      return newTokens;
    }

    const data = docSnap.data();
    const lastReset = parseTimestamp(data.lastReset);
    const storedTier = data.tier as SubscriptionTier || "free";

    // Vérifier si le tier a changé (upgrade/downgrade)
    const tierChanged = storedTier !== tier;

    // Reset si nouveau jour OU si tier a changé
    if (shouldResetTokens(lastReset) || tierChanged) {
      await setDoc(docRef, {
        tokens: maxTokens,
        maxTokens,
        lastReset: serverTimestamp(),
        tier,
      });

      return {
        tokens: maxTokens,
        maxTokens,
        lastReset: new Date(),
        tier,
      };
    }

    return {
      tokens: data.tokens ?? maxTokens,
      maxTokens,
      lastReset,
      tier,
    };
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return {
      ...DEFAULT_TOKENS,
      maxTokens: TOKEN_LIMITS[tier],
      tier,
    };
  }
}

/**
 * Consomme un jeton
 * Retourne true si succès, false si plus de jetons
 */
export async function consumeToken(userId: string, tier: SubscriptionTier): Promise<{ success: boolean; remaining: number }> {
  // Admin = illimité
  if (tier === "admin") {
    return { success: true, remaining: Infinity };
  }

  try {
    const docRef = doc(db, "users", userId, "usage", "tokens");
    const current = await getUserTokens(userId, tier);

    if (current.tokens <= 0) {
      return { success: false, remaining: 0 };
    }

    const newTokens = current.tokens - 1;

    await setDoc(docRef, {
      tokens: newTokens,
      maxTokens: current.maxTokens,
      lastReset: current.lastReset ? Timestamp.fromDate(current.lastReset) : serverTimestamp(),
      tier,
    });

    return { success: true, remaining: newTokens };
  } catch (error) {
    console.error("Error consuming token:", error);
    return { success: false, remaining: 0 };
  }
}

/**
 * Vérifie si l'utilisateur a des jetons disponibles
 */
export async function hasTokens(userId: string, tier: SubscriptionTier): Promise<boolean> {
  if (tier === "admin") return true;

  const tokens = await getUserTokens(userId, tier);
  return tokens.tokens > 0;
}

/**
 * Force le reset des jetons (admin use)
 */
export async function resetUserTokens(userId: string, tier: SubscriptionTier): Promise<void> {
  const docRef = doc(db, "users", userId, "usage", "tokens");
  const maxTokens = TOKEN_LIMITS[tier];

  await setDoc(docRef, {
    tokens: maxTokens,
    maxTokens,
    lastReset: serverTimestamp(),
    tier,
  });
}
