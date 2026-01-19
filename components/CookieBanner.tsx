"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/context/CookieConsentContext";

export default function CookieBanner() {
  const { hasDecision, setConsent } = useCookieConsent();

  if (hasDecision) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl border border-border/60 bg-background/90 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Vos donnees, votre choix</p>
          <p>
            Nous utilisons des cookies d&apos;analyse pour comprendre l&apos;usage et ameliorer Pokéindex.
            Aucun cookie publicitaire.
          </p>
          <Link href="/mentions-legales" className="text-xs font-semibold text-primary hover:underline">
            En savoir plus
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConsent({ analytics: false })}
          >
            Refuser
          </Button>
          <Button
            size="sm"
            onClick={() => setConsent({ analytics: true })}
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
