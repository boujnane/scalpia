"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  UserSubscription,
  SubscriptionTier,
  DEFAULT_SUBSCRIPTION,
  getUserSubscription,
  getEffectiveTier,
  hasProAccess,
  setUserSubscription,
} from "@/lib/subscription";
import { captureEvent, identifyUser, resetUser, setPersonProperties } from "@/lib/posthog";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  subscription: UserSubscription;
  tier: SubscriptionTier;
  isPro: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  subscription: DEFAULT_SUBSCRIPTION,
  tier: "free",
  isPro: false,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription>(DEFAULT_SUBSCRIPTION);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // User logged in → fetch subscription from Firestore
        let sub = await getUserSubscription(firebaseUser.uid);

        // Auto-create admin for the first/main admin account
        // TODO: Replace with your admin email
        const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        if (sub.tier === "free" && firebaseUser.email === ADMIN_EMAIL) {
          console.log("[Auth] Auto-creating admin subscription for:", firebaseUser.email);
          await setUserSubscription(firebaseUser.uid, "admin", null);
          sub = await getUserSubscription(firebaseUser.uid);
        }

        setSubscription(sub);
      } else {
        // Not logged in → Free tier
        setSubscription(DEFAULT_SUBSCRIPTION);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const tier = getEffectiveTier(subscription);
  const isPro = hasProAccess(subscription);
  const isAdmin = tier === "admin";

  useEffect(() => {
    if (!user) {
      resetUser();
      return;
    }

    identifyUser(user.uid, {
      email: user.email ?? undefined,
      plan: tier,
    });

    setPersonProperties({ plan: tier });

    const createdAt = user.metadata?.creationTime ? new Date(user.metadata.creationTime) : null;
    if (!createdAt) return;

    const hoursSinceSignup = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceSignup < 24 || hoursSinceSignup > 48) return;

    const key = `ph_day1_return_${user.uid}`;
    if (typeof window !== "undefined" && window.localStorage.getItem(key)) return;

    captureEvent("day_1_return", {
      hoursSinceSignup: Math.round(hoursSinceSignup * 10) / 10,
    });

    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, "1");
    }
  }, [user, tier]);

  return (
    <AuthContext.Provider value={{ user, loading, subscription, tier, isPro, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
