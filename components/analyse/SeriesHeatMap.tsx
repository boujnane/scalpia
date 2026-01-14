"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";
import { detectSeriesSignal } from "@/lib/analyse/signals";

interface SeriesHeatMapProps {
  series: SeriesFinanceSummary[];
  title?: string;
  metric?: "return7d" | "return30d" | "premiumNow";
}

/**
 * Heat Map interactive des séries pour visualiser rapidement les performances
 */
export default function SeriesHeatMap({
  series,
  title = "Vue d'ensemble des séries",
  metric = "return30d",
}: SeriesHeatMapProps) {
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

  const sortedSeries = useMemo(() => {
    return [...series].sort((a, b) => {
      const aVal = a.metrics[metric] ?? -999;
      const bVal = b.metrics[metric] ?? -999;
      return bVal - aVal;
    });
  }, [series, metric]);

  const getColorClass = (value: number | null): string => {
    if (value == null) return "bg-muted border-border text-foreground hover:bg-muted/80";

    // Échelle de couleurs avec meilleur contraste et texte visible
    if (value > 0.08) return "bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 border-emerald-700 dark:border-emerald-400 text-white shadow-md";
    if (value > 0.05) return "bg-emerald-500 dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-700 border-emerald-600 dark:border-emerald-500 text-white shadow-sm";
    if (value > 0.02) return "bg-emerald-400 dark:bg-emerald-700 hover:bg-emerald-500 dark:hover:bg-emerald-800 border-emerald-500 dark:border-emerald-600 text-white";
    if (value > 0) return "bg-emerald-300 dark:bg-emerald-800 hover:bg-emerald-400 dark:hover:bg-emerald-900 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100";

    if (value > -0.02) return "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100";

    if (value > -0.05) return "bg-rose-300 dark:bg-rose-800 hover:bg-rose-400 dark:hover:bg-rose-900 border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-100";
    if (value > -0.08) return "bg-rose-400 dark:bg-rose-700 hover:bg-rose-500 dark:hover:bg-rose-800 border-rose-500 dark:border-rose-600 text-white";
    if (value > -0.12) return "bg-rose-500 dark:bg-rose-600 hover:bg-rose-600 dark:hover:bg-rose-700 border-rose-600 dark:border-rose-500 text-white shadow-sm";
    return "bg-rose-600 dark:bg-rose-500 hover:bg-rose-700 dark:hover:bg-rose-600 border-rose-700 dark:border-rose-400 text-white shadow-md";
  };

  const formatPercent = (value: number | null): string => {
    if (value == null) return "N/A";
    const formatted = (value * 100).toFixed(1);
    return value > 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const getMetricLabel = (): string => {
    switch (metric) {
      case "return7d":
        return "7 jours";
      case "return30d":
        return "30 jours";
      case "premiumNow":
        return "Surcote actuelle";
      default:
        return "";
    }
  };

  const getTrendIcon = (value: number | null) => {
    if (value == null || Math.abs(value) < 0.01)
      return <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />;
    return value > 0 ? (
      <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
    ) : (
      <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
    );
  };

  const selectedSeriesData = selectedSeries
    ? sortedSeries.find((s) => s.seriesName === selectedSeries)
    : null;

  return (
    <TooltipProvider>
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
              <CardDescription>Variation sur {getMetricLabel()}</CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                <span className="text-muted-foreground">Hausse</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600"></div>
                <span className="text-muted-foreground">Neutre</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-rose-500"></div>
                <span className="text-muted-foreground">Baisse</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Grille Heat Map */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {sortedSeries.map((s) => {
              const value = s.metrics[metric];
              const signal = detectSeriesSignal(s);
              const isSelected = selectedSeries === s.seriesName;

              return (
                <Tooltip key={s.seriesName}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() =>
                        setSelectedSeries(isSelected ? null : s.seriesName)
                      }
                      className={`
                        relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200
                        ${getColorClass(value)}
                        ${
                          isSelected
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 z-10"
                            : ""
                        }
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                      `}
                    >
                      {/* Signal badge (petit) */}
                      {signal.type !== "none" && (() => {
                        const IconComponent = signal.icon;
                        return (
                          <div className="absolute -top-1 -right-1 z-10">
                            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                        );
                      })()}

                      <div className="space-y-1.5 text-left">
                        <p className="text-xs sm:text-sm font-bold line-clamp-2 capitalize leading-tight">
                          {s.seriesName}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="shrink-0">{getTrendIcon(value)}</div>
                          <p className="text-sm sm:text-base font-extrabold tabular-nums">
                            {formatPercent(value)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-popover text-popover-foreground" side="top">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm capitalize text-foreground">{s.seriesName}</p>
                      <p className="text-xs text-muted-foreground">
                        Variation {getMetricLabel()}: <span className="font-semibold text-foreground">{formatPercent(value)}</span>
                      </p>
                      {signal.type !== "none" && (() => {
                        const IconComponent = signal.icon;
                        return (
                          <p className="text-xs text-muted-foreground pt-1 border-t border-border/50 flex items-center gap-1">
                            <IconComponent className="w-3.5 h-3.5" />
                            {signal.description}
                          </p>
                        );
                      })()}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Détails de la série sélectionnée */}
          {selectedSeriesData && (
            <div className="p-3 sm:p-4 rounded-xl bg-accent/50 border border-border animate-in slide-in-from-bottom-2 shadow-sm">
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
                  <h4 className="font-bold text-sm sm:text-base capitalize text-foreground">
                    {selectedSeriesData.seriesName}
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <div className="p-2 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Surcote</p>
                      <p className="font-bold text-xs sm:text-sm text-foreground tabular-nums">
                        {formatPercent(selectedSeriesData.metrics.premiumNow)}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Var. 7j</p>
                      <p className="font-bold text-xs sm:text-sm text-foreground tabular-nums">
                        {formatPercent(selectedSeriesData.metrics.return7d)}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Var. 30j</p>
                      <p className="font-bold text-xs sm:text-sm text-foreground tabular-nums">
                        {formatPercent(selectedSeriesData.metrics.return30d)}
                      </p>
                    </div>
                    <div className="p-2 rounded-lg bg-background/50 border border-border/50">
                      <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5">Score</p>
                      <p className="font-bold text-xs sm:text-sm text-foreground tabular-nums">
                        {selectedSeriesData.metrics.score?.toFixed(0) ?? "N/A"}/100
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSeries(null)}
                  className="shrink-0 p-1 sm:p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition text-sm sm:text-base"
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Légende mobile */}
          <div className="sm:hidden flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs pt-2 border-t border-border/50">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500"></div>
              <span className="text-muted-foreground">Hausse</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600"></div>
              <span className="text-muted-foreground">Neutre</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-rose-500"></div>
              <span className="text-muted-foreground">Baisse</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
