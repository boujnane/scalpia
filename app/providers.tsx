"use client";

import { useEffect, useRef, useState } from "react";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import type { PostHog } from "posthog-js";
import { useCookieConsent } from "@/context/CookieConsentContext";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { consent } = useCookieConsent();
  const [client, setClient] = useState<PostHog | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

    if (!posthogKey) return;
    if (initRef.current) return;
    initRef.current = true;

    const load = () => {
      import("posthog-js").then((mod) => {
        const posthog = mod.default;
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
        setClient(posthog);
      });
    };

    if (typeof requestIdleCallback === "function") {
      requestIdleCallback(load);
    } else {
      setTimeout(load, 1000);
    }
  }, []);

  // Handle consent changes once PostHog is loaded
  useEffect(() => {
    if (!client) return;

    if (consent.analytics) {
      if (typeof client.opt_in_capturing === "function") {
        client.opt_in_capturing();
      }
    } else {
      if (typeof client.opt_out_capturing === "function") {
        client.opt_out_capturing();
      }
    }
  }, [consent.analytics, client]);

  if (!client) {
    return <>{children}</>;
  }

  return <PHProvider client={client}>{children}</PHProvider>;
}
