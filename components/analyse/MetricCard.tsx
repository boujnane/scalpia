"use client";

import React from "react";
import { Info, TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getTermExplanation, TerminologyKey } from "@/lib/analyse/terminology";

// ============================================================================
// TYPES
// ============================================================================

type MetricVariant = "default" | "positive" | "negative" | "warning" | "info";

interface MetricCardProps {
  label: string;
  value: string | number | null;
  suffix?: string;
  termKey?: TerminologyKey;
  description?: string;
  variant?: MetricVariant;
  size?: "sm" | "md" | "lg";
  showTrend?: boolean;
  trendValue?: number | null;
  className?: string;
  compact?: boolean;
}

interface MetricRowProps {
  label: string;
  value: string | number | null;
  suffix?: string;
  termKey?: TerminologyKey;
  variant?: MetricVariant;
  showBar?: boolean;
  barValue?: number; // 0-100 ou 0-1
  barMax?: number;
}

interface MetricGroupProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getVariantClasses(variant: MetricVariant) {
  switch (variant) {
    case "positive":
      return {
        text: "text-success",
        bg: "bg-success/10",
        border: "border-success/30",
      };
    case "negative":
      return {
        text: "text-destructive",
        bg: "bg-destructive/10",
        border: "border-destructive/30",
      };
    case "warning":
      return {
        text: "text-warning",
        bg: "bg-warning/10",
        border: "border-warning/30",
      };
    case "info":
      return {
        text: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/30",
      };
    default:
      return {
        text: "text-foreground",
        bg: "bg-muted",
        border: "border-border",
      };
  }
}

function formatValue(value: string | number | null, suffix?: string): string {
  if (value == null) return "N/A";
  if (typeof value === "number") {
    if (suffix === "%") {
      return `${(value * 100).toFixed(2)}%`;
    }
    if (Number.isFinite(value)) {
      return value.toFixed(2);
    }
    return "N/A";
  }
  return value + (suffix || "");
}

function determineVariant(value: number | null, thresholds?: { good: number; bad: number; invert?: boolean }): MetricVariant {
  if (value == null || !thresholds) return "default";
  const { good, bad, invert } = thresholds;

  if (invert) {
    if (value <= good) return "positive";
    if (value >= bad) return "negative";
  } else {
    if (value >= good) return "positive";
    if (value <= bad) return "negative";
  }
  return "default";
}

// ============================================================================
// COMPOSANTS
// ============================================================================

/**
 * MetricCard - Carte individuelle pour une métrique avec tooltip explicatif
 */
export function MetricCard({
  label,
  value,
  suffix,
  termKey,
  description,
  variant = "default",
  size = "md",
  showTrend,
  trendValue,
  className,
  compact = false,
}: MetricCardProps) {
  const colors = getVariantClasses(variant);
  const term = termKey ? getTermExplanation(termKey) : null;

  const sizeClasses = {
    sm: "p-2 sm:p-3",
    md: "p-3 sm:p-4",
    lg: "p-4 sm:p-5",
  };

  const valueSizes = {
    sm: "text-lg sm:text-xl",
    md: "text-xl sm:text-2xl",
    lg: "text-2xl sm:text-3xl",
  };

  const TrendIcon =
    trendValue == null
      ? Minus
      : trendValue > 0
      ? TrendingUp
      : trendValue < 0
      ? TrendingDown
      : Minus;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        colors.border,
        sizeClasses[size],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
              {label}
            </p>
            {(term || description) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground/60 hover:text-muted-foreground transition shrink-0">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs" side="top">
                  {term ? (
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground">{term.simple}</p>
                      <p className="text-xs text-muted-foreground">{term.explanation}</p>
                      {term.example && (
                        <p className="text-xs text-primary italic">{term.example}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs">{description}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <p
            className={cn(
              "font-bold tabular-nums mt-1",
              valueSizes[size],
              colors.text
            )}
          >
            {formatValue(value, suffix)}
          </p>
        </div>

        {showTrend && trendValue != null && (
          <div
            className={cn(
              "p-1.5 sm:p-2 rounded-lg shrink-0",
              trendValue > 0 ? "bg-success/10" : trendValue < 0 ? "bg-destructive/10" : "bg-muted"
            )}
          >
            <TrendIcon
              className={cn(
                "w-3.5 h-3.5 sm:w-4 sm:h-4",
                trendValue > 0
                  ? "text-success"
                  : trendValue < 0
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * MetricRow - Ligne de métrique pour tableaux ou listes compactes
 */
export function MetricRow({
  label,
  value,
  suffix,
  termKey,
  variant = "default",
  showBar = false,
  barValue,
  barMax = 100,
}: MetricRowProps) {
  const colors = getVariantClasses(variant);
  const term = termKey ? getTermExplanation(termKey) : null;

  const barPercent = barValue != null ? Math.min((barValue / barMax) * 100, 100) : 0;

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm text-muted-foreground truncate">{label}</span>
        {term && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground/50 hover:text-muted-foreground transition shrink-0">
                <Info className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">{term.simple}</p>
              <p className="text-xs text-muted-foreground">{term.explanation}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showBar && barValue != null && (
          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", colors.bg.replace("/10", ""))}
              style={{ width: `${barPercent}%` }}
            />
          </div>
        )}
        <span className={cn("text-sm font-semibold tabular-nums", colors.text)}>
          {formatValue(value, suffix)}
        </span>
      </div>
    </div>
  );
}

/**
 * MetricGroup - Groupe de métriques avec titre et icône
 */
export function MetricGroup({
  title,
  description,
  icon,
  children,
  className,
}: MetricGroupProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 sm:p-5", className)}>
      <div className="flex items-start gap-3 mb-4">
        {icon && (
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// ============================================================================
// COMPOSANTS SPÉCIFIQUES AUX INDICATEURS FINANCIERS
// ============================================================================

interface RatioGaugeProps {
  value: number | null;
  label: string;
  termKey?: TerminologyKey;
  thresholds: { excellent: number; good: number; bad: number };
}

/**
 * RatioGauge - Jauge visuelle pour les ratios (Sharpe, Sortino, etc.)
 */
export function RatioGauge({ value, label, termKey, thresholds }: RatioGaugeProps) {
  const term = termKey ? getTermExplanation(termKey) : null;

  let variant: MetricVariant = "default";
  let qualityLabel = "Neutre";

  if (value != null) {
    if (value >= thresholds.excellent) {
      variant = "positive";
      qualityLabel = "Excellent";
    } else if (value >= thresholds.good) {
      variant = "info";
      qualityLabel = "Bon";
    } else if (value <= thresholds.bad) {
      variant = "negative";
      qualityLabel = "Faible";
    }
  }

  const colors = getVariantClasses(variant);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {term && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground/50 hover:text-muted-foreground transition">
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">{term.simple}</p>
              <p className="text-xs text-muted-foreground">{term.explanation}</p>
              {term.example && (
                <p className="text-xs text-primary mt-1 italic">{term.example}</p>
              )}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className={cn("text-xs font-medium px-2 py-0.5 rounded", colors.bg, colors.text)}>
          {qualityLabel}
        </span>
        <span className={cn("text-sm font-bold tabular-nums", colors.text)}>
          {value != null ? value.toFixed(2) : "N/A"}
        </span>
      </div>
    </div>
  );
}

interface RSIIndicatorProps {
  value: number | null;
  signal: "oversold" | "neutral" | "overbought" | null;
}

/**
 * RSIIndicator - Affichage visuel du RSI avec zones colorées
 * Seuils adaptés au marché scellé Pokémon (35/65 au lieu de 30/70)
 */
export function RSIIndicator({ value, signal }: RSIIndicatorProps) {
  const term = getTermExplanation("rsi");

  const getSignalInfo = () => {
    switch (signal) {
      case "oversold":
        return { label: "Survendu", color: "text-success", bg: "bg-success/10", description: "Potentiel rebond" };
      case "overbought":
        return { label: "Suracheté", color: "text-warning", bg: "bg-warning/10", description: "Prudence conseillée" };
      default:
        return { label: "Neutre", color: "text-muted-foreground", bg: "bg-muted", description: "Zone équilibrée" };
    }
  };

  const info = getSignalInfo();

  return (
    <TooltipProvider>
      <div className="p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">RSI (adapté)</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/50 hover:text-muted-foreground transition">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">{term.simple}</p>
                <p className="text-xs text-muted-foreground">{term.explanation}</p>
                <p className="text-xs text-primary mt-2 italic">
                  Seuils adaptés au marché scellé : survendu &lt; 35, suracheté &gt; 65
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <span className={cn("text-xl font-bold tabular-nums", info.color)}>
            {value != null ? value.toFixed(0) : "N/A"}
          </span>
        </div>

        {/* Barre de progression avec zones adaptées */}
        <div className="relative h-3 rounded-full bg-gradient-to-r from-success/30 via-muted to-warning/30 overflow-hidden">
          {value != null && (
            <div
              className="absolute top-0 w-1.5 h-full bg-foreground rounded-full shadow-sm"
              style={{ left: `${Math.min(Math.max(value, 0), 100)}%`, transform: "translateX(-50%)" }}
            />
          )}
          {/* Marqueurs de zone (35% et 65%) */}
          <div className="absolute top-0 left-[35%] w-px h-full bg-border" />
          <div className="absolute top-0 left-[65%] w-px h-full bg-border" />
        </div>

        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>0</span>
          <span className="text-success">35</span>
          <span>50</span>
          <span className="text-warning">65</span>
          <span>100</span>
        </div>

        <div className={cn("mt-3 p-2 rounded-lg text-center", info.bg)}>
          <span className={cn("text-sm font-medium", info.color)}>{info.label}</span>
          <span className="text-xs text-muted-foreground ml-2">- {info.description}</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
