// lib/subscription.ts
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type SubscriptionTier = "free" | "pro" | "admin";

export type UserSubscription = {
  tier: SubscriptionTier;
  createdAt: Date | null;
  expiresAt: Date | null; // null = never expires (admin)
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
};

export const DEFAULT_SUBSCRIPTION: UserSubscription = {
  tier: "free",
  createdAt: null,
  expiresAt: null,
};

/**
 * Get user subscription from Firestore
 * Returns "free" tier if no subscription document exists
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  try {
    const docRef = doc(db, "subscriptions", userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return DEFAULT_SUBSCRIPTION;
    }

    const data = docSnap.data();

    // Handle Firestore Timestamps safely (can be null or Timestamp)
    const parseTimestamp = (val: unknown): Date | null => {
      if (!val) return null;
      if (typeof val === "object" && "toDate" in val && typeof (val as { toDate: () => Date }).toDate === "function") {
        return (val as { toDate: () => Date }).toDate();
      }
      if (val instanceof Date) return val;
      return null;
    };

    return {
      tier: data.tier || "free",
      createdAt: parseTimestamp(data.createdAt),
      expiresAt: parseTimestamp(data.expiresAt),
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
    };
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return DEFAULT_SUBSCRIPTION;
  }
}

/**
 * Check if subscription is active (not expired)
 */
export function isSubscriptionActive(sub: UserSubscription): boolean {
  if (sub.tier === "admin") return true; // Admin never expires
  if (sub.tier === "free") return true; // Free is always "active"
  if (!sub.expiresAt) return true; // No expiry = active
  return new Date() < sub.expiresAt;
}

/**
 * Get effective tier (considering expiration)
 */
export function getEffectiveTier(sub: UserSubscription): SubscriptionTier {
  if (!isSubscriptionActive(sub)) return "free";
  return sub.tier;
}

/**
 * Check if user has Pro access (pro or admin)
 */
export function hasProAccess(sub: UserSubscription): boolean {
  const tier = getEffectiveTier(sub);
  return tier === "pro" || tier === "admin";
}

/**
 * Create or update subscription (admin use)
 */
export async function setUserSubscription(
  userId: string,
  tier: SubscriptionTier,
  expiresAt?: Date | null
): Promise<void> {
  const docRef = doc(db, "subscriptions", userId);
  await setDoc(docRef, {
    tier,
    createdAt: serverTimestamp(),
    expiresAt: expiresAt || null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
