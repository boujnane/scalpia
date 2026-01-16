"use client";

import React, { useMemo } from "react";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  ArrowUpCircle,
  ArrowDownCircle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

interface SignalsWidgetProps {
  series: SeriesFinanceSummary[];
  onSeriesClick?: (series: SeriesFinanceSummary) => void;
  className?: string;
}

type SignalType = "oversold" | "overbought" | "breakout_up" | "breakout_down" | "momentum_up" | "momentum_down";

interface Signal {
  type: SignalType;
  series: SeriesFinanceSummary;
  strength: "strong" | "moderate";
  reason: string;
}

const signalConfig: Record<SignalType, { label: string; icon: typeof AlertCircle; color: string; bgColor: string }> = {
  oversold: {
    label: "Survendu",
    icon: ArrowDownCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  overbought: {
    label: "Suracheté",
    icon: ArrowUpCircle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  breakout_up: {
    label: "Breakout haussier",
    icon: TrendingUp,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
  },
  breakout_down: {
    label: "Breakout baissier",
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
  },
  momentum_up: {
    label: "Momentum positif",
    icon: Zap,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  momentum_down: {
    label: "Momentum négatif",
    icon: Target,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
  },
};

export function SignalsWidget({ series, onSeriesClick, className }: SignalsWidgetProps) {
  const signals = useMemo(() => {
    const result: Signal[] = [];

    for (const s of series) {
      const { rsi14, rsiSignal, return7d, return30d, slope30d, vol30d, sharpeRatio } = s.metrics;

      // RSI Oversold signal
      if (rsiSignal === "oversold" && rsi14 != null) {
        result.push({
          type: "oversold",
          series: s,
          strength: rsi14 < 25 ? "strong" : "moderate",
          reason: `RSI à ${rsi14.toFixed(0)} - potentiel rebond`,
        });
      }

      // RSI Overbought signal
      if (rsiSignal === "overbought" && rsi14 != null) {
        result.push({
          type: "overbought",
          series: s,
          strength: rsi14 > 75 ? "strong" : "moderate",
          reason: `RSI à ${rsi14.toFixed(0)} - correction possible`,
        });
      }

      // Strong upward breakout (7d return > 10% with positive slope)
      if (return7d != null && return7d > 0.10 && slope30d != null && slope30d > 0.002) {
        result.push({
          type: "breakout_up",
          series: s,
          strength: return7d > 0.15 ? "strong" : "moderate",
          reason: `+${(return7d * 100).toFixed(1)}% sur 7j avec tendance haussière`,
        });
      }

      // Strong downward breakout (7d return < -10%)
      if (return7d != null && return7d < -0.10 && slope30d != null && slope30d < -0.002) {
        result.push({
          type: "breakout_down",
          series: s,
          strength: return7d < -0.15 ? "strong" : "moderate",
          reason: `${(return7d * 100).toFixed(1)}% sur 7j avec tendance baissière`,
        });
      }

      // Positive momentum (good Sharpe + positive returns + low vol)
      if (
        sharpeRatio != null &&
        sharpeRatio > 1 &&
        return30d != null &&
        return30d > 0.05 &&
        vol30d != null &&
        vol30d < 0.06
      ) {
        result.push({
          type: "momentum_up",
          series: s,
          strength: sharpeRatio > 1.5 ? "strong" : "moderate",
          reason: `Sharpe ${sharpeRatio.toFixed(2)} - rendement/risque optimal`,
        });
      }

      // Negative momentum (bad Sharpe + negative returns)
      if (
        sharpeRatio != null &&
        sharpeRatio < -0.5 &&
        return30d != null &&
        return30d < -0.05
      ) {
        result.push({
          type: "momentum_down",
          series: s,
          strength: sharpeRatio < -1 ? "strong" : "moderate",
          reason: `Sharpe ${sharpeRatio.toFixed(2)} - performance dégradée`,
        });
      }
    }

    // Sort by strength (strong first) then by type priority
    const typePriority: SignalType[] = ["oversold", "breakout_up", "momentum_up", "overbought", "breakout_down", "momentum_down"];
    result.sort((a, b) => {
      if (a.strength !== b.strength) return a.strength === "strong" ? -1 : 1;
      return typePriority.indexOf(a.type) - typePriority.indexOf(b.type);
    });

    return result.slice(0, 8); // Limit to 8 signals
  }, [series]);

  // Group signals by type for summary
  const signalSummary = useMemo(() => {
    const counts: Partial<Record<SignalType, number>> = {};
    signals.forEach((s) => {
      counts[s.type] = (counts[s.type] || 0) + 1;
    });
    return counts;
  }, [signals]);

  return (
    <TooltipProvider>
      <Card className={cn("border-border/50 shadow-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            Signaux Actifs
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {signals.length}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/50 hover:text-muted-foreground">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Signaux techniques basés sur RSI, momentum et breakouts.
                  Cliquez sur un signal pour voir les détails de la série.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {signals.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun signal actif</p>
              <p className="text-xs mt-1">Le marché est calme</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Signal type summary */}
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border/50">
                {Object.entries(signalSummary).map(([type, count]) => {
                  const config = signalConfig[type as SignalType];
                  return (
                    <span
                      key={type}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                        config.bgColor,
                        config.color
                      )}
                    >
                      {config.label}: {count}
                    </span>
                  );
                })}
              </div>

              {/* Signal list */}
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {signals.map((signal, idx) => {
                  const config = signalConfig[signal.type];
                  const Icon = config.icon;

                  return (
                    <button
                      key={`${signal.series.seriesName}-${signal.type}-${idx}`}
                      onClick={() => onSeriesClick?.(signal.series)}
                      className={cn(
                        "w-full flex items-start gap-2 p-2 rounded-lg transition-colors text-left",
                        "hover:bg-muted/50",
                        signal.strength === "strong" && "ring-1 ring-primary/20"
                      )}
                    >
                      <div className={cn("p-1.5 rounded-md shrink-0", config.bgColor)}>
                        <Icon className={cn("w-3.5 h-3.5", config.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium capitalize truncate">
                            {signal.series.seriesName}
                          </p>
                          {signal.strength === "strong" && (
                            <Badge variant="default" className="text-[8px] px-1 py-0 h-4">
                              FORT
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {signal.reason}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("shrink-0 text-[10px]", config.color)}
                      >
                        {config.label}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
