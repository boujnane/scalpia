"use client";

import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Flame, AlertTriangle } from "lucide-react";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

interface TopMoversProps {
  series: SeriesFinanceSummary[];
  metric?: "return7d" | "return30d";
  limit?: number;
}

export default function TopMovers({
  series,
  metric = "return7d",
  limit = 3,
}: TopMoversProps) {
  const { gainers, losers } = useMemo(() => {
    // Filtrer les séries avec des données valides
    const validSeries = series.filter(s => s.metrics[metric] != null);

    // Trier par performance
    const sorted = [...validSeries].sort((a, b) => {
      const aVal = a.metrics[metric] ?? 0;
      const bVal = b.metrics[metric] ?? 0;
      return bVal - aVal;
    });

    return {
      gainers: sorted.slice(0, limit).filter(s => (s.metrics[metric] ?? 0) > 0),
      losers: sorted.slice(-limit).reverse().filter(s => (s.metrics[metric] ?? 0) < 0),
    };
  }, [series, metric, limit]);

  const formatPercent = (value: number | null): string => {
    if (value == null) return "—";
    const formatted = (value * 100).toFixed(1);
    return value > 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const periodLabel = metric === "return7d" ? "7 jours" : "30 jours";

  if (gainers.length === 0 && losers.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Gainers */}
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/20">
            <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-emerald-900 dark:text-emerald-100">
              Top Hausses
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              Sur {periodLabel}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {gainers.length > 0 ? (
            gainers.map((s, idx) => (
              <div
                key={s.seriesName}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/60 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-700/30"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-sm text-foreground capitalize truncate max-w-[120px] sm:max-w-[160px]">
                    {s.seriesName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="font-bold text-sm tabular-nums">
                    {formatPercent(s.metrics[metric])}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-emerald-600/60 dark:text-emerald-400/60 text-center py-2">
              Aucune série en hausse
            </p>
          )}
        </div>
      </div>

      {/* Top Losers */}
      <div className="rounded-xl border border-rose-200 dark:border-rose-800/50 bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-rose-500/20">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-rose-900 dark:text-rose-100">
              Top Baisses
            </h3>
            <p className="text-xs text-rose-600 dark:text-rose-400">
              Sur {periodLabel}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {losers.length > 0 ? (
            losers.map((s, idx) => (
              <div
                key={s.seriesName}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/60 dark:bg-rose-900/30 border border-rose-200/50 dark:border-rose-700/30"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-sm text-foreground capitalize truncate max-w-[120px] sm:max-w-[160px]">
                    {s.seriesName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span className="font-bold text-sm tabular-nums">
                    {formatPercent(s.metrics[metric])}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-rose-600/60 dark:text-rose-400/60 text-center py-2">
              Aucune série en baisse
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
