"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import {
  UserTokens,
  DEFAULT_TOKENS,
  TOKEN_LIMITS,
  getUserTokens,
  consumeToken as consumeTokenApi,
} from "@/lib/tokens";

type TokenContextType = {
  tokens: number;
  maxTokens: number;
  loading: boolean;
  /** Consomme 1 jeton. Retourne true si succès, false si plus de jetons */
  consumeToken: () => Promise<boolean>;
  /** Rafraîchit les jetons depuis Firestore */
  refreshTokens: () => Promise<void>;
  /** Pourcentage de jetons restants (0-100) */
  percentage: number;
  /** True si l'utilisateur n'a plus de jetons */
  isExhausted: boolean;
  /** True si l'utilisateur est admin (jetons illimités) */
  isUnlimited: boolean;
};

const TokenContext = createContext<TokenContextType>({
  tokens: DEFAULT_TOKENS.tokens,
  maxTokens: DEFAULT_TOKENS.maxTokens,
  loading: true,
  consumeToken: async () => false,
  refreshTokens: async () => {},
  percentage: 100,
  isExhausted: false,
  isUnlimited: false,
});

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const { user, tier, loading: authLoading } = useAuth();
  const [tokenData, setTokenData] = useState<UserTokens>(DEFAULT_TOKENS);
  const [loading, setLoading] = useState(true);

  // Charger les jetons quand l'user/tier change
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Non connecté = jetons par défaut (free)
      setTokenData({
        tokens: TOKEN_LIMITS.free,
        maxTokens: TOKEN_LIMITS.free,
        lastReset: null,
        tier: "free",
      });
      setLoading(false);
      return;
    }

    // Charger depuis Firestore
    setLoading(true);
    getUserTokens(user.uid, tier)
      .then((data) => setTokenData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, tier, authLoading]);

  const refreshTokens = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserTokens(user.uid, tier);
      setTokenData(data);
    } catch (error) {
      console.error("Error refreshing tokens:", error);
    } finally {
      setLoading(false);
    }
  }, [user, tier]);

  const consumeToken = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    // Admin = toujours OK
    if (tier === "admin") return true;

    // Vérifier localement d'abord
    if (tokenData.tokens <= 0) return false;

    // Optimistic update
    setTokenData((prev) => ({
      ...prev,
      tokens: Math.max(0, prev.tokens - 1),
    }));

    // Appel API
    const result = await consumeTokenApi(user.uid, tier);

    if (!result.success) {
      // Rollback si échec
      await refreshTokens();
      return false;
    }

    // Sync avec la vraie valeur
    setTokenData((prev) => ({
      ...prev,
      tokens: result.remaining,
    }));

    return true;
  }, [user, tier, tokenData.tokens, refreshTokens]);

  const isUnlimited = tier === "admin";
  const percentage = isUnlimited ? 100 : Math.round((tokenData.tokens / tokenData.maxTokens) * 100);
  const isExhausted = !isUnlimited && tokenData.tokens <= 0;

  return (
    <TokenContext.Provider
      value={{
        tokens: tokenData.tokens,
        maxTokens: tokenData.maxTokens,
        loading,
        consumeToken,
        refreshTokens,
        percentage,
        isExhausted,
        isUnlimited,
      }}
    >
      {children}
    </TokenContext.Provider>
  );
}

export function useTokens() {
  return useContext(TokenContext);
}
