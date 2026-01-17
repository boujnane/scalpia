"use client";

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
        <Icons.zap className="h-3.5 w-3.5" />
        {loading ? (
          <span className="w-6 h-3 bg-current/20 rounded animate-pulse" />
        ) : isUnlimited ? (
          <span>∞</span>
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
        <Icons.zap className="h-4 w-4" />
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

  if (!open) return null;

  // Cas 1: Utilisateur non connecté
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative bg-card text-card-foreground w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 animate-in fade-in zoom-in-95">
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
    );
  }

  // Cas 2: Utilisateur connecté mais plus de jetons
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-card text-card-foreground w-full max-w-md rounded-2xl shadow-2xl border border-border p-6 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition"
        >
          <Icons.close className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center mb-4">
            <Icons.zap className="h-8 w-8 text-orange-500" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Plus de jetons !</h2>

          <p className="text-muted-foreground mb-6">
            {isPro
              ? "Tu as utilisé tes 300 recherches quotidiennes. Reviens demain !"
              : "Tu as utilisé tes 15 recherches gratuites du jour."}
          </p>

          {!isPro && (
            <div className="space-y-3">
              <a
                href="/pricing"
                className="
                  flex items-center justify-center gap-2 w-full py-3 rounded-xl
                  bg-gradient-to-r from-primary to-purple-600 text-primary-foreground
                  font-bold transition hover:opacity-90
                "
              >
                <Icons.sparkles className="h-5 w-5" />
                Passer en Pro (300/jour)
              </a>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl border border-border hover:bg-muted transition"
              >
                Revenir plus tard
              </button>
            </div>
          )}

          {isPro && (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl border border-border hover:bg-muted transition"
            >
              Compris
            </button>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Les jetons se réinitialisent chaque jour à minuit.
          </p>
        </div>
      </div>
    </div>
  );
}
