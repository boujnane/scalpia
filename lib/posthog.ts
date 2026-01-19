"use client";

import posthog from "posthog-js";

type PosthogWindow = Window & {
  posthog?: {
    capture?: (event: string, properties?: Record<string, unknown>) => void;
    identify?: (distinctId: string, properties?: Record<string, unknown>) => void;
    people?: {
      set?: (properties?: Record<string, unknown> | string) => void;
    };
    reset?: () => void;
  };
};

function getPosthog() {
  if (typeof window === "undefined") return null;
  return posthog ?? (window as PosthogWindow).posthog ?? null;
}

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  const ph = getPosthog();
  if (!ph?.capture) return;
  ph.capture(event, properties);
}

export function identifyUser(distinctId: string, properties?: Record<string, unknown>) {
  const ph = getPosthog();
  if (!ph?.identify) return;
  ph.identify(distinctId, properties);
}

export function setPersonProperties(properties?: Record<string, unknown>) {
  const ph = getPosthog();
  if (!ph?.people?.set) return;
  ph.people.set(properties ?? {});
}

export function resetUser() {
  const ph = getPosthog();
  if (!ph?.reset) return;
  ph.reset();
}
