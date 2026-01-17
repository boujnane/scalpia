"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Activity,
  Shield,
  BarChart3,
  Gauge,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

interface MarketSentimentWidgetProps {
  series: SeriesFinanceSummary[];
  className?: string;
}

type SentimentLevel =
  | "extreme_fear"
  | "fear"
  | "neutral"
  | "greed"
  | "extreme_greed";

interface SentimentComponent {
  name: string;
  score: number; // 0-100
  weight: number;
  description: string;
  icon: typeof Activity;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function MarketSentimentWidget({
  series,
  className,
}: MarketSentimentWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const sentiment = useMemo(() => {
    if (series.length === 0) return null;

    const total = series.length;
    const components: SentimentComponent[] = [];

    // ═══════════════════════════════════════════════════════════════
    // COMPOSANTE 1: Dynamique du marché (ratio hausse/baisse) - 20%
    // ═══════════════════════════════════════════════════════════════
    const upCount = series.filter((s) => s.trend7d === "up").length;
    const downCount = series.filter((s) => s.trend7d === "down").length;
    const stableCount = total - upCount - downCount;
    const upRatio = upCount / total;
    const downRatio = downCount / total;
    const dynamicScore = Math.max(0, Math.min(100, 50 + (upRatio - downRatio) * 50));
    components.push({
      name: "Dynamique",
      score: dynamicScore,
      weight: 20,
      description: `${upCount} séries en hausse, ${downCount} en baisse`,
      icon: Activity,
    });

    // ═══════════════════════════════════════════════════════════════
    // COMPOSANTE 2: Momentum (RSI moyen) - 20%
    // ═══════════════════════════════════════════════════════════════
    const validRsi = series
      .map((s) => s.metrics.rsi14)
      .filter((x): x is number => x != null);
    let momentumScore = 50;
    if (validRsi.length > 0) {
      const avgRsi = validRsi.reduce((sum, r) => sum + r, 0) / validRsi.length;
      momentumScore = avgRsi;
    }
    components.push({
      name: "Momentum",
      score: momentumScore,
      weight: 20,
      description: `RSI moyen: ${momentumScore.toFixed(0)}`,
      icon: Gauge,
    });

    // ═══════════════════════════════════════════════════════════════
    // COMPOSANTE 3: Performance récente (rendements 7j) - 20%
    // ═══════════════════════════════════════════════════════════════
    const validReturns7d = series
      .map((s) => s.metrics.return7d)
      .filter((x): x is number => x != null);
    let performanceScore = 50;
    if (validReturns7d.length > 0) {
      const avgReturn = validReturns7d.reduce((sum, r) => sum + r, 0) / validReturns7d.length;
      performanceScore = Math.max(0, Math.min(100, 50 + (avgReturn / 0.15) * 50));
    }
    const avgReturn7d =
      validReturns7d.length > 0
        ? validReturns7d.reduce((sum, r) => sum + r, 0) / validReturns7d.length
        : 0;
    components.push({
      name: "Performance",
      score: performanceScore,
      weight: 20,
      description: `Rendement 7j: ${avgReturn7d >= 0 ? "+" : ""}${(avgReturn7d * 100).toFixed(1)}%`,
      icon: BarChart3,
    });

    // ═══════════════════════════════════════════════════════════════
    // COMPOSANTE 4: Qualité (Sharpe Ratio) - 15%
    // ═══════════════════════════════════════════════════════════════
    const validSharpe = series
      .map((s) => s.metrics.sharpeRatio)
      .filter((x): x is number => x != null);
    let qualityScore = 50;
    if (validSharpe.length > 0) {
      const avgSharpe = validSharpe.reduce((sum, s) => sum + s, 0) / validSharpe.length;
      qualityScore = Math.max(0, Math.min(100, 50 + avgSharpe * 25));
    }
    const avgSharpe =
      validSharpe.length > 0
        ? validSharpe.reduce((sum, s) => sum + s, 0) / validSharpe.length
        : 0;
    components.push({
      name: "Qualité",
      score: qualityScore,
      weight: 15,
      description: `Sharpe moyen: ${avgSharpe.toFixed(2)}`,
      icon: Shield,
    });

    // ═══════════════════════════════════════════════════════════════
    // COMPOSANTE 5: Risque (volatilité inverse) - 15%
    // ═══════════════════════════════════════════════════════════════
    const validVol = series
      .map((s) => s.metrics.vol30d)
      .filter((x): x is number => x != null);
    let riskScore = 50;
    let medianVol = 0;
    if (validVol.length > 0) {
      medianVol = median(validVol) ?? 0;
      if (medianVol <= 0.02) {
        riskScore = 100 - (medianVol / 0.02) * 20;
      } else if (medianVol <= 0.05) {
        riskScore = 80 - ((medianVol - 0.02) / 0.03) * 30;
      } else if (medianVol <= 0.10) {
        riskScore = 50 - ((medianVol - 0.05) / 0.05) * 30;
      } else {
        riskScore = Math.max(0, 20 - ((medianVol - 0.10) / 0.10) * 20);
      }
    }
    components.push({
      name: "Stabilité",
      score: riskScore,
      weight: 15,
      description: `Volatilité médiane: ${(medianVol * 100).toFixed(1)}%`,
      icon: Shield,
    });

    // ═══════════════════════════════════════════════════════════════
    // COMPOSANTE 6: Tendance de fond (slope 30j) - 10%
    // ═══════════════════════════════════════════════════════════════
    const validSlopes = series
      .map((s) => s.metrics.slope30d)
      .filter((x): x is number => x != null);
    let trendScore = 50;
    if (validSlopes.length > 0) {
      const avgSlope = validSlopes.reduce((sum, s) => sum + s, 0) / validSlopes.length;
      trendScore = Math.max(0, Math.min(100, 50 + avgSlope * 10000));
    }
    components.push({
      name: "Tendance",
      score: trendScore,
      weight: 10,
      description: trendScore > 55 ? "Haussière" : trendScore < 45 ? "Baissière" : "Neutre",
      icon: TrendingUp,
    });

    // ═══════════════════════════════════════════════════════════════
    // CALCUL DU SCORE FINAL PONDÉRÉ
    // ═══════════════════════════════════════════════════════════════
    const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
    const weightedScore =
      components.reduce((sum, c) => sum + c.score * c.weight, 0) / totalWeight;
    const finalScore = Math.max(0, Math.min(100, weightedScore));

    // ═══════════════════════════════════════════════════════════════
    // NIVEAU DE SENTIMENT
    // ═══════════════════════════════════════════════════════════════
    let level: SentimentLevel;
    let label: string;
    let color: string;
    let bgColor: string;

    if (finalScore <= 20) {
      level = "extreme_fear";
      label = "Peur Extrême";
      color = "text-red-500";
      bgColor = "bg-red-500";
    } else if (finalScore <= 40) {
      level = "fear";
      label = "Peur";
      color = "text-orange-500";
      bgColor = "bg-orange-500";
    } else if (finalScore <= 60) {
      level = "neutral";
      label = "Neutre";
      color = "text-slate-400";
      bgColor = "bg-slate-500";
    } else if (finalScore <= 80) {
      level = "greed";
      label = "Optimisme";
      color = "text-emerald-500";
      bgColor = "bg-emerald-500";
    } else {
      level = "extreme_greed";
      label = "Euphorie";
      color = "text-green-400";
      bgColor = "bg-green-500";
    }

    // ═══════════════════════════════════════════════════════════════
    // MÉTRIQUES DE SANTÉ DU MARCHÉ
    // ═══════════════════════════════════════════════════════════════
    const validVaR = series
      .map((s) => s.metrics.var95)
      .filter((x): x is number => x != null);
    const medianVaR = median(validVaR);

    const validReturn30d = series
      .map((s) => s.metrics.return30d)
      .filter((x): x is number => x != null);
    const avgReturn30d =
      validReturn30d.length > 0
        ? validReturn30d.reduce((sum, r) => sum + r, 0) / validReturn30d.length
        : null;

    const freshSeries = series.filter(
      (s) => s.metrics.freshnessDays != null && s.metrics.freshnessDays <= 7
    ).length;
    const dataFreshness = (freshSeries / total) * 100;

    const sortedByReturn7d = [...series]
      .filter((s) => s.metrics.return7d != null)
      .sort((a, b) => (b.metrics.return7d ?? 0) - (a.metrics.return7d ?? 0));
    const topPerformer = sortedByReturn7d[0];
    const worstPerformer = sortedByReturn7d[sortedByReturn7d.length - 1];

    return {
      score: Math.round(finalScore),
      level,
      label,
      color,
      bgColor,
      upCount,
      downCount,
      stableCount,
      components,
      marketHealth: {
        medianVol,
        medianVaR,
        avgReturn7d,
        avgReturn30d,
        dataFreshness,
        avgSharpe,
      },
      topPerformer,
      worstPerformer,
      total,
    };
  }, [series]);

  if (!sentiment) {
    return null;
  }

  const rotation = (sentiment.score / 100) * 180 - 90;

  const getComponentColor = (score: number) => {
    if (score <= 30) return "text-red-500";
    if (score <= 45) return "text-orange-500";
    if (score <= 55) return "text-slate-400";
    if (score <= 70) return "text-emerald-500";
    return "text-green-400";
  };

  const getProgressColor = (score: number) => {
    if (score <= 30) return "bg-red-500";
    if (score <= 45) return "bg-orange-500";
    if (score <= 55) return "bg-slate-500";
    if (score <= 70) return "bg-emerald-500";
    return "bg-green-500";
  };

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
                  Indice composite: dynamique, momentum, performance, qualité, stabilité, tendance.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* ═══════════════════════════════════════════════════════ */}
          {/* JAUGE COMPACTE */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="relative w-full max-w-[200px] mx-auto aspect-[2/1]">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              <defs>
                <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="25%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#64748b" />
                  <stop offset="75%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              <path
                d="M 20 95 A 80 80 0 0 1 180 95"
                fill="none"
                stroke="url(#sentimentGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                className="opacity-30"
              />

              <path
                d="M 20 95 A 80 80 0 0 1 180 95"
                fill="none"
                stroke="url(#sentimentGradient)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(sentiment.score / 100) * 251} 251`}
              />
            </svg>

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

          {/* Stats rapides */}
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

          {/* ═══════════════════════════════════════════════════════ */}
          {/* BOUTON EXPAND */}
          {/* ═══════════════════════════════════════════════════════ */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50"
          >
            {isExpanded ? (
              <>
                Masquer les détails <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Voir les détails <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION EXPANDABLE */}
          {/* ═══════════════════════════════════════════════════════ */}
          {isExpanded && (
            <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-200">
              {/* Composantes de l'indice */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Composantes
                </p>
                <div className="space-y-2">
                  {sentiment.components.map((comp) => (
                    <Tooltip key={comp.name}>
                      <TooltipTrigger asChild>
                        <div className="group cursor-help">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <comp.icon
                                className={cn("w-3 h-3", getComponentColor(comp.score))}
                              />
                              <span className="text-[11px] font-medium">{comp.name}</span>
                              <span className="text-[9px] text-muted-foreground">
                                ({comp.weight}%)
                              </span>
                            </div>
                            <span
                              className={cn(
                                "text-[11px] font-bold tabular-nums",
                                getComponentColor(comp.score)
                              )}
                            >
                              {comp.score.toFixed(0)}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                getProgressColor(comp.score)
                              )}
                              style={{ width: `${comp.score}%` }}
                            />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">{comp.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>

              {/* Santé du marché */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Santé du marché
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-1.5 rounded bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Activity className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">Volatilité</span>
                    </div>
                    <p className="text-xs font-bold tabular-nums">
                      {(sentiment.marketHealth.medianVol * 100).toFixed(1)}%
                    </p>
                  </div>

                  {sentiment.marketHealth.medianVaR != null && (
                    <div className="p-1.5 rounded bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-1 mb-0.5">
                        <Shield className="w-2.5 h-2.5 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">VaR 95%</span>
                      </div>
                      <p className="text-xs font-bold tabular-nums text-amber-500">
                        -{(sentiment.marketHealth.medianVaR * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {sentiment.marketHealth.avgReturn30d != null && (
                    <div className="p-1.5 rounded bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-1 mb-0.5">
                        <BarChart3 className="w-2.5 h-2.5 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">Rend. 30j</span>
                      </div>
                      <p
                        className={cn(
                          "text-xs font-bold tabular-nums",
                          sentiment.marketHealth.avgReturn30d >= 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {sentiment.marketHealth.avgReturn30d >= 0 ? "+" : ""}
                        {(sentiment.marketHealth.avgReturn30d * 100).toFixed(1)}%
                      </p>
                    </div>
                  )}

                  <div className="p-1.5 rounded bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Gauge className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">Sharpe</span>
                    </div>
                    <p
                      className={cn(
                        "text-xs font-bold tabular-nums",
                        sentiment.marketHealth.avgSharpe >= 0.5
                          ? "text-success"
                          : sentiment.marketHealth.avgSharpe < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                      )}
                    >
                      {sentiment.marketHealth.avgSharpe.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top & Worst performers */}
              {(sentiment.topPerformer || sentiment.worstPerformer) && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Extrêmes (7j)
                  </p>
                  {sentiment.topPerformer && (
                    <div className="flex items-center justify-between p-1.5 rounded bg-success/5 border border-success/20">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <TrendingUp className="w-3 h-3 text-success shrink-0" />
                        <span className="text-[11px] font-medium truncate capitalize">
                          {sentiment.topPerformer.seriesName}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-success tabular-nums shrink-0">
                        +{((sentiment.topPerformer.metrics.return7d ?? 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {sentiment.worstPerformer &&
                    sentiment.worstPerformer.metrics.return7d != null &&
                    sentiment.worstPerformer.metrics.return7d < 0 && (
                      <div className="flex items-center justify-between p-1.5 rounded bg-destructive/5 border border-destructive/20">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <TrendingDown className="w-3 h-3 text-destructive shrink-0" />
                          <span className="text-[11px] font-medium truncate capitalize">
                            {sentiment.worstPerformer.seriesName}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-destructive tabular-nums shrink-0">
                          {((sentiment.worstPerformer.metrics.return7d ?? 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                </div>
              )}

              {/* Footer */}
              <div className="pt-1.5 border-t border-border/30">
                <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                  <span>Basé sur {sentiment.total} séries</span>
                  <span className="flex items-center gap-1">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        sentiment.marketHealth.dataFreshness > 80
                          ? "bg-success"
                          : sentiment.marketHealth.dataFreshness > 50
                            ? "bg-amber-500"
                            : "bg-destructive"
                      )}
                    />
                    {sentiment.marketHealth.dataFreshness.toFixed(0)}% données fraîches
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
