"use client";

import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

interface MarketSentimentWidgetProps {
  series: SeriesFinanceSummary[];
  className?: string;
}

type SentimentLevel = "extreme_fear" | "fear" | "neutral" | "greed" | "extreme_greed";

export function MarketSentimentWidget({ series, className }: MarketSentimentWidgetProps) {
  const sentiment = useMemo(() => {
    if (series.length === 0) return null;

    // Calculate sentiment score (0-100) based on multiple factors
    let score = 50; // Start neutral

    // Factor 1: Ratio of up vs down series (weight: 30%)
    const upCount = series.filter((s) => s.trend7d === "up").length;
    const downCount = series.filter((s) => s.trend7d === "down").length;
    const total = series.length;
    const upRatio = upCount / total;
    const downRatio = downCount / total;
    score += (upRatio - downRatio) * 30;

    // Factor 2: Average RSI (weight: 25%)
    const validRsi = series.filter((s) => s.metrics.rsi14 != null);
    if (validRsi.length > 0) {
      const avgRsi = validRsi.reduce((sum, s) => sum + (s.metrics.rsi14 ?? 50), 0) / validRsi.length;
      // RSI 30 = fear, RSI 70 = greed
      score += ((avgRsi - 50) / 50) * 25;
    }

    // Factor 3: Average return 7d (weight: 25%)
    const validReturns = series.filter((s) => s.metrics.return7d != null);
    if (validReturns.length > 0) {
      const avgReturn = validReturns.reduce((sum, s) => sum + (s.metrics.return7d ?? 0), 0) / validReturns.length;
      // ±10% swing = full impact
      score += Math.max(-25, Math.min(25, avgReturn * 250));
    }

    // Factor 4: Momentum (slope) (weight: 20%)
    const validSlopes = series.filter((s) => s.metrics.slope30d != null);
    if (validSlopes.length > 0) {
      const avgSlope = validSlopes.reduce((sum, s) => sum + (s.metrics.slope30d ?? 0), 0) / validSlopes.length;
      score += Math.max(-20, Math.min(20, avgSlope * 2000));
    }

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine sentiment level
    let level: SentimentLevel;
    let label: string;
    let color: string;
    let bgColor: string;

    if (score <= 20) {
      level = "extreme_fear";
      label = "Peur extrême";
      color = "text-red-500";
      bgColor = "bg-red-500";
    } else if (score <= 40) {
      level = "fear";
      label = "Peur";
      color = "text-orange-500";
      bgColor = "bg-orange-500";
    } else if (score <= 60) {
      level = "neutral";
      label = "Neutre";
      color = "text-slate-500";
      bgColor = "bg-slate-500";
    } else if (score <= 80) {
      level = "greed";
      label = "Avidité";
      color = "text-emerald-500";
      bgColor = "bg-emerald-500";
    } else {
      level = "extreme_greed";
      label = "Avidité extrême";
      color = "text-green-500";
      bgColor = "bg-green-500";
    }

    return {
      score: Math.round(score),
      level,
      label,
      color,
      bgColor,
      upCount,
      downCount,
      stableCount: total - upCount - downCount,
    };
  }, [series]);

  if (!sentiment) {
    return null;
  }

  // Calculate gauge rotation (-90deg to 90deg for 0-100)
  const rotation = (sentiment.score / 100) * 180 - 90;

  return (
    <TooltipProvider>
      <Card className={cn("border-border/50 shadow-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            {sentiment.level.includes("greed") ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : sentiment.level.includes("fear") ? (
              <TrendingDown className="w-4 h-4 text-destructive" />
            ) : (
              <Minus className="w-4 h-4 text-muted-foreground" />
            )}
            Sentiment du Marché
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/50 hover:text-muted-foreground">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Calculé à partir du ratio hausse/baisse, RSI moyen, rendements 7j et momentum des séries.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Gauge */}
          <div className="relative w-full max-w-[200px] mx-auto aspect-[2/1] mb-4">
            {/* Background arc */}
            <svg viewBox="0 0 200 100" className="w-full h-full">
              {/* Gradient background */}
              <defs>
                <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="25%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#64748b" />
                  <stop offset="75%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Arc background */}
              <path
                d="M 20 95 A 80 80 0 0 1 180 95"
                fill="none"
                stroke="url(#sentimentGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                className="opacity-30"
              />

              {/* Active arc */}
              <path
                d="M 20 95 A 80 80 0 0 1 180 95"
                fill="none"
                stroke="url(#sentimentGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(sentiment.score / 100) * 251} 251`}
              />
            </svg>

            {/* Needle */}
            <div
              className="absolute bottom-0 left-1/2 w-1 h-[70px] origin-bottom transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
            >
              <div className={cn("w-full h-full rounded-full", sentiment.bgColor)} />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-foreground" />
            </div>
          </div>

          {/* Score display */}
          <div className="text-center mb-4">
            <p className={cn("text-4xl font-bold tabular-nums", sentiment.color)}>
              {sentiment.score}
            </p>
            <p className={cn("text-sm font-semibold", sentiment.color)}>
              {sentiment.label}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-success/10">
              <p className="text-lg font-bold text-success">{sentiment.upCount}</p>
              <p className="text-[10px] text-muted-foreground">Hausse</p>
            </div>
            <div className="p-2 rounded-lg bg-muted">
              <p className="text-lg font-bold text-muted-foreground">{sentiment.stableCount}</p>
              <p className="text-[10px] text-muted-foreground">Stable</p>
            </div>
            <div className="p-2 rounded-lg bg-destructive/10">
              <p className="text-lg font-bold text-destructive">{sentiment.downCount}</p>
              <p className="text-[10px] text-muted-foreground">Baisse</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
