"use client";

import React from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface ProWidgetProps {
  /** ✅ Contenu réel (uniquement Pro) */
  children: React.ReactNode;

  /** ✅ Aperçu (safe) visible derrière le blur pour non-Pro */
  preview: React.ReactNode;

  forceAccess?: boolean;
  title?: string;
  className?: string;
  blurClassName?: string;
}

export function ProWidget({
  children,
  preview,
  forceAccess,
  title,
  className,
  blurClassName = "blur-[6px]",
}: ProWidgetProps) {
  const { isPro, loading } = useAuth();
  const hasAccess = forceAccess !== undefined ? forceAccess : isPro;

  if (loading) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl animate-pulse bg-muted/50 min-h-[220px]",
          className
        )}
      />
    );
  }

  if (hasAccess) {
    return <div className={cn("rounded-xl", className)}>{children}</div>;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* ✅ Preview flouté (safe) */}
      <div className={cn("pointer-events-none select-none", blurClassName)} aria-hidden="true">
        {preview}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
          <Lock className="w-5 h-5 text-primary" />
        </div>

        {title && <p className="font-semibold text-foreground text-sm">{title}</p>}

        <p className="text-xs text-muted-foreground max-w-[34ch]">
          Débloquez les indicateurs avancés (sentiment, volatilité, risque) + alertes.
        </p>

        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Passer en Pro
        </Link>

        <p className="text-[10px] text-muted-foreground/70">
          Les données Pro ne sont pas visibles sans abonnement.
        </p>
      </div>
    </div>
  );
}

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold",
        "bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border border-primary/30",
        className
      )}
    >
      <Sparkles className="w-2.5 h-2.5" />
      PRO
    </span>
  );
}
