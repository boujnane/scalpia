"use client";

import React from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface ProWidgetProps {
  children: React.ReactNode;
  forceAccess?: boolean; // Override manual (optional)
  title?: string;
  className?: string;
}

/**
 * Wrapper component that locks content for non-Pro users.
 * Shows a blurred overlay with upgrade CTA when user doesn't have Pro subscription.
 * Pro and Admin users see the content unlocked.
 */
export function ProWidget({ children, forceAccess, title, className }: ProWidgetProps) {
  const { isPro, loading } = useAuth();

  // If forceAccess is explicitly set, use it. Otherwise, check subscription.
  const hasAccess = forceAccess !== undefined ? forceAccess : isPro;

  // Show content if user has access
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show skeleton while loading auth state
  if (loading) {
    return (
      <div className={cn("relative overflow-hidden rounded-xl animate-pulse bg-muted/50 min-h-[200px]", className)} />
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {/* Blurred content */}
      <div className="blur-[6px] pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4">
        <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <div className="text-center">
          {title && (
            <p className="font-semibold text-foreground text-sm mb-1">{title}</p>
          )}
          <p className="text-xs text-muted-foreground mb-3">
            Disponible avec le plan Pro
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Passer en Pro
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Badge to indicate Pro-only features
 */
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
