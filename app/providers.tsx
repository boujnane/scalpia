"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

if (typeof window !== "undefined" && posthogKey) {
  const alreadyLoaded = (posthog as unknown as { __loaded?: boolean }).__loaded;
  if (!alreadyLoaded) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: "identified_only",
      defaults: "2025-11-30",
      capture_pageview: true,
    });
  }
  (window as { posthog?: typeof posthog }).posthog = posthog;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}
