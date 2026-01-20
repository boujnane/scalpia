"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CookieConsent = {
  analytics: boolean;
  decidedAt?: string;
};

type CookieConsentContextType = {
  consent: CookieConsent;
  hasDecision: boolean;
  resetConsent: () => void;
  setConsent: (next: CookieConsent) => void;
};

const DEFAULT_CONSENT: CookieConsent = { analytics: false };

const CookieConsentContext = createContext<CookieConsentContextType>({
  consent: DEFAULT_CONSENT,
  hasDecision: false,
  resetConsent: () => {},
  setConsent: () => {},
});

const STORAGE_KEY = "cookie_consent_v1";

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<CookieConsent>(DEFAULT_CONSENT);
  const [hasDecision, setHasDecision] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as CookieConsent;
      const hasDecisionStamp = typeof parsed.decidedAt === "string" && parsed.decidedAt.length > 0;
      if (!hasDecisionStamp) return;
      setConsentState({
        analytics: Boolean(parsed.analytics),
        decidedAt: parsed.decidedAt,
      });
      setHasDecision(true);
    } catch {
      setHasDecision(false);
    }
  }, []);

  const setConsent = (next: CookieConsent) => {
    const withStamp = { ...next, decidedAt: new Date().toISOString() };
    setConsentState(withStamp);
    setHasDecision(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withStamp));
    }
  };

  const resetConsent = () => {
    setConsentState(DEFAULT_CONSENT);
    setHasDecision(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = useMemo(
    () => ({
      consent,
      hasDecision,
      resetConsent,
      setConsent,
    }),
    [consent, hasDecision]
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
  return useContext(CookieConsentContext);
}
