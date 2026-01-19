"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useCookieConsent } from "@/context/CookieConsentContext";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { consent } = useCookieConsent();

  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

    if (!posthogKey) return;

    const alreadyLoaded = (posthog as unknown as { __loaded?: boolean }).__loaded;
    if (!alreadyLoaded) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: "identified_only",
        defaults: "2025-11-30",
        capture_pageview: true,
      });
      (window as { posthog?: typeof posthog }).posthog = posthog;
    }

    if (consent.analytics) {
      if (typeof posthog.opt_in_capturing === "function") {
        posthog.opt_in_capturing();
      }
    } else {
      if (typeof posthog.opt_out_capturing === "function") {
        posthog.opt_out_capturing();
      }
    }
  }, [consent.analytics]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
