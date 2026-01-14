"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Signal } from "@/lib/analyse/signals";
import { getSignalColorClasses } from "@/lib/analyse/signals";

interface SignalBadgeProps {
  signal: Signal;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Composant qui affiche un signal visuel sous forme de badge
 */
export function SignalBadge({ signal, showTooltip = true, size = "md", className = "" }: SignalBadgeProps) {
  if (signal.type === "none") return null;

  const colors = getSignalColorClasses(signal.color);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const IconComponent = signal.icon;

  const badge = (
    <Badge
      variant="outline"
      className={`${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} font-semibold whitespace-nowrap ${className}`}
    >
      <IconComponent className="w-3.5 h-3.5 mr-1.5" />
      {signal.label}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{badge}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-popover text-popover-foreground">
          <p className="text-xs text-foreground">{signal.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface SignalBadgeListProps {
  signals: Signal[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Composant qui affiche plusieurs signaux sous forme de liste
 */
export function SignalBadgeList({
  signals,
  maxVisible = 2,
  size = "sm",
  className = "",
}: SignalBadgeListProps) {
  const visibleSignals = signals.filter((s) => s.type !== "none").slice(0, maxVisible);

  if (visibleSignals.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {visibleSignals.map((signal, idx) => (
        <SignalBadge key={`${signal.type}-${idx}`} signal={signal} size={size} />
      ))}
    </div>
  );
}
