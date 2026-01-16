"use client";

import React, { useMemo } from "react";
import { Activity, Info, AlertTriangle, Shield, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

interface VolatilityGaugeWidgetProps {
  series: SeriesFinanceSummary[];
  className?: string;
}

type VolLevel = "very_low" | "low" | "moderate" | "high" | "very_high";

export function VolatilityGaugeWidget({ series, className }: VolatilityGaugeWidgetProps) {
  const volatility = useMemo(() => {
    const validSeries = series.filter((s) => s.metrics.vol30d != null);
    if (validSeries.length === 0) return null;

    // Calculate average volatility
    const avgVol = validSeries.reduce((sum, s) => sum + (s.metrics.vol30d ?? 0), 0) / validSeries.length;

    // Find max volatility series
    const maxVolSeries = validSeries.reduce((max, s) =>
      (s.metrics.vol30d ?? 0) > (max.metrics.vol30d ?? 0) ? s : max
    , validSeries[0]);

    // Find min volatility series
    const minVolSeries = validSeries.reduce((min, s) =>
      (s.metrics.vol30d ?? 0) < (min.metrics.vol30d ?? 0) ? s : min
    , validSeries[0]);

    // Count by volatility level
    const veryLow = validSeries.filter((s) => (s.metrics.vol30d ?? 0) < 0.02).length;
    const low = validSeries.filter((s) => (s.metrics.vol30d ?? 0) >= 0.02 && (s.metrics.vol30d ?? 0) < 0.04).length;
    const moderate = validSeries.filter((s) => (s.metrics.vol30d ?? 0) >= 0.04 && (s.metrics.vol30d ?? 0) < 0.07).length;
    const high = validSeries.filter((s) => (s.metrics.vol30d ?? 0) >= 0.07 && (s.metrics.vol30d ?? 0) < 0.10).length;
    const veryHigh = validSeries.filter((s) => (s.metrics.vol30d ?? 0) >= 0.10).length;

    // Determine market volatility level
    let level: VolLevel;
    let label: string;
    let color: string;
    let description: string;
    const Icon = Activity;

    if (avgVol < 0.02) {
      level = "very_low";
      label = "Très calme";
      color = "text-blue-500";
      description = "Le marché est exceptionnellement stable";
    } else if (avgVol < 0.04) {
      level = "low";
      label = "Calme";
      color = "text-emerald-500";
      description = "Faible volatilité, conditions favorables";
    } else if (avgVol < 0.07) {
      level = "moderate";
      label = "Modéré";
      color = "text-yellow-500";
      description = "Volatilité normale du marché";
    } else if (avgVol < 0.10) {
      level = "high";
      label = "Élevé";
      color = "text-orange-500";
      description = "Mouvements importants, prudence requise";
    } else {
      level = "very_high";
      label = "Très élevé";
      color = "text-red-500";
      description = "Forte instabilité, risque accru";
    }

    return {
      avgVol,
      avgVolPercent: (avgVol * 100).toFixed(1),
      level,
      label,
      color,
      description,
      maxVolSeries,
      minVolSeries,
      distribution: { veryLow, low, moderate, high, veryHigh },
      total: validSeries.length,
    };
  }, [series]);

  if (!volatility) {
    return null;
  }

  // Calculate bar widths for distribution
  const maxCount = Math.max(
    volatility.distribution.veryLow,
    volatility.distribution.low,
    volatility.distribution.moderate,
    volatility.distribution.high,
    volatility.distribution.veryHigh,
    1
  );

  return (
    <TooltipProvider>
      <Card className={cn("border-border/50 shadow-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Volatilité du Marché
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/50 hover:text-muted-foreground">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Mesure la dispersion des variations de prix sur 30 jours.
                  Une volatilité élevée = plus de risque mais aussi plus d'opportunités.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Main metric */}
          <div className="text-center py-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              {volatility.level === "very_low" || volatility.level === "low" ? (
                <Shield className={cn("w-5 h-5", volatility.color)} />
              ) : volatility.level === "high" || volatility.level === "very_high" ? (
                <AlertTriangle className={cn("w-5 h-5", volatility.color)} />
              ) : (
                <Zap className={cn("w-5 h-5", volatility.color)} />
              )}
              <p className={cn("text-3xl font-bold tabular-nums", volatility.color)}>
                {volatility.avgVolPercent}%
              </p>
            </div>
            <p className={cn("text-sm font-semibold", volatility.color)}>
              {volatility.label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {volatility.description}
            </p>
          </div>

          {/* Distribution bars */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Distribution</p>

            <div className="space-y-1.5">
              {[
                { label: "<2%", count: volatility.distribution.veryLow, color: "bg-blue-500" },
                { label: "2-4%", count: volatility.distribution.low, color: "bg-emerald-500" },
                { label: "4-7%", count: volatility.distribution.moderate, color: "bg-yellow-500" },
                { label: "7-10%", count: volatility.distribution.high, color: "bg-orange-500" },
                { label: ">10%", count: volatility.distribution.veryHigh, color: "bg-red-500" },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">
                    {label}
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", color)}
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium tabular-nums w-6">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Extremes */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground mb-1">Plus volatile</p>
              <p className="text-xs font-medium capitalize truncate">
                {volatility.maxVolSeries.seriesName}
              </p>
              <p className="text-xs font-bold text-destructive tabular-nums">
                {((volatility.maxVolSeries.metrics.vol30d ?? 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground mb-1">Plus stable</p>
              <p className="text-xs font-medium capitalize truncate">
                {volatility.minVolSeries.seriesName}
              </p>
              <p className="text-xs font-bold text-success tabular-nums">
                {((volatility.minVolSeries.metrics.vol30d ?? 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
