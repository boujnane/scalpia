"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTokens } from "@/context/TokenContext";
import { useAuth } from "@/context/AuthContext";
import { Icons } from "@/components/icons";

type TokenBadgeProps = {
  /** Afficher en version compacte (juste le nombre) */
  compact?: boolean;
  /** Callback quand on clique sur le badge */
  onClick?: () => void;
};

export function TokenBadge({ compact = false, onClick }: TokenBadgeProps) {
  const { tokens, maxTokens, loading, percentage, isExhausted, isUnlimited } = useTokens();
  const { user, isPro } = useAuth();

  // Ne pas afficher si non connecté
  if (!user) return null;

  // Couleur selon le pourcentage
  const getColor = () => {
    if (isUnlimited) return "text-purple-500 bg-purple-500/10 border-purple-500/30";
    if (isExhausted) return "text-red-500 bg-red-500/10 border-red-500/30";
    if (percentage <= 20) return "text-orange-500 bg-orange-500/10 border-orange-500/30";
    if (percentage <= 50) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/30";
  };

  // Version compacte
  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={loading}
        className={`
          flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-bold
          transition-all duration-300 hover:scale-105
          ${getColor()}
          ${loading ? "opacity-50 animate-pulse" : ""}
        `}
        title={isUnlimited ? "Jetons illimités (Admin)" : `${tokens}/${maxTokens} jetons restants`}
      >
        <Icons.pokeball className="h-3.5 w-3.5" color="currentColor" />
        {loading ? (
          <span className="w-6 h-3 bg-current/20 rounded animate-pulse" />
        ) : isUnlimited ? (
          <span className="relative -top-[1px] text-xl leading-none">∞</span>
        ) : (
          <span>{tokens}</span>
        )}
      </button>
    );
  }

  // Version complète
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl border backdrop-blur-sm
        transition-all duration-300 hover:scale-[1.02]
        ${getColor()}
        ${loading ? "opacity-50" : ""}
      `}
    >
      <div className="flex items-center gap-2">
        <Icons.pokeball className="h-4 w-4" color="currentColor" />
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase tracking-wider opacity-70">
            {isPro ? "Pro" : "Free"}
          </span>
          {loading ? (
            <span className="text-sm font-bold">...</span>
          ) : isUnlimited ? (
            <span className="text-sm font-bold">Illimité</span>
          ) : (
            <span className="text-sm font-bold tabular-nums">
              {tokens} / {maxTokens}
            </span>
          )}
        </div>
      </div>

      {/* Barre de progression */}
      {!isUnlimited && !loading && (
        <div className="w-12 h-1.5 bg-current/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-current rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </button>
  );
}

/**
 * Modal affichée quand l'utilisateur n'a plus de jetons ou n'est pas connecté
 */
export function NoTokensModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, isPro } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open) return null;
  if (!mounted) return null;

  // Cas 1: Utilisateur non connecté
  if (!user) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative bg-card text-card-foreground w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 animate-in fade-in zoom-in-95 pointer-events-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition"
          >
            <Icons.close className="h-5 w-5" />
          </button>

          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-4">
              <Icons.user className="h-8 w-8 text-primary" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Connexion requise</h2>

            <p className="text-muted-foreground mb-6">
              Connecte-toi pour explorer les séries et accéder à tes 15 recherches gratuites par jour.
            </p>

            <div className="space-y-3">
              <a
                href="/login?redirect=/cartes"
                className="
                  flex items-center justify-center gap-2 w-full py-3 rounded-xl
                  bg-gradient-to-r from-primary to-purple-600 text-primary-foreground
                  font-bold transition hover:opacity-90
                "
              >
                <Icons.user className="h-5 w-5" />
                Se connecter
              </a>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl border border-border hover:bg-muted transition"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    , document.body);
  }

  // Cas 2: Utilisateur connecté mais plus de jetons
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-card text-card-foreground w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 pointer-events-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted transition"
        >
          <Icons.close className="h-5 w-5" />
        </button>

        {/* Header gradient */}
        <div className="bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent p-6 pb-4">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/20 border-2 border-orange-500/40 flex items-center justify-center mb-4">
              <Icons.zap className="h-8 w-8 text-orange-500" />
            </div>

            <h2 className="text-2xl font-bold mb-1">Jetons épuisés</h2>
            <p className="text-sm text-muted-foreground">
              {isPro
                ? "Tu as utilisé tes 300 recherches aujourd'hui"
                : "0/15 jetons restants aujourd'hui"}
            </p>
          </div>
        </div>

        <div className="p-6 pt-4">
          {!isPro ? (
            <>
              {/* Comparaison Free vs Pro */}
              <div className="mb-6 rounded-xl border border-border overflow-hidden">
                <div className="grid grid-cols-2 text-center text-sm">
                  <div className="p-3 bg-muted/30 border-r border-border">
                    <p className="text-xs text-muted-foreground mb-1">Gratuit</p>
                    <p className="font-bold text-muted-foreground">15 / jour</p>
                  </div>
                  <div className="p-3 bg-primary/5">
                    <p className="text-xs text-primary mb-1">Pro</p>
                    <p className="font-bold text-primary">300 / jour</p>
                  </div>
                </div>
              </div>

              {/* Avantages Pro */}
              <div className="space-y-2 mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avec Pro, tu débloques aussi :</p>
                <div className="grid gap-2 text-sm">
                  {[
                    "Indicateurs avancés (sentiment, volatilité)",
                    "Historique 30 jours (vs 7 jours)",
                    "Support prioritaire",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <Icons.check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <a
                  href="/pricing"
                  className="
                    flex items-center justify-center gap-2 w-full py-3.5 rounded-xl
                    bg-gradient-to-r from-primary to-purple-600 text-primary-foreground
                    font-bold transition hover:opacity-90 shadow-lg shadow-primary/20
                  "
                >
                  <Icons.sparkles className="h-5 w-5" />
                  Passer Pro — 9€/mois
                </a>

                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition"
                >
                  Réessayer demain
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Annulable à tout moment · Sans engagement
              </p>
            </>
          ) : (
            <>
              <p className="text-center text-muted-foreground mb-6">
                Tes jetons se réinitialisent chaque jour à minuit. Reviens demain pour continuer à explorer !
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl border border-border hover:bg-muted transition font-medium"
              >
                Compris
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  , document.body);
}
