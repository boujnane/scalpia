"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  ArrowUpCircle,
  ArrowDownCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
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

const signalConfig: Record<SignalType, { label: string; icon: typeof AlertCircle; color: string; bgColor: string; sentiment: "bullish" | "bearish" | "neutral" }> = {
  oversold: {
    label: "Survendu",
    icon: ArrowDownCircle,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10",
    sentiment: "bullish",
  },
  overbought: {
    label: "Suracheté",
    icon: ArrowUpCircle,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10",
    sentiment: "bearish",
  },
  breakout_up: {
    label: "Breakout haussier",
    icon: TrendingUp,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-500/10",
    sentiment: "bullish",
  },
  breakout_down: {
    label: "Breakout baissier",
    icon: TrendingDown,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-500/10",
    sentiment: "bearish",
  },
  momentum_up: {
    label: "Momentum positif",
    icon: Zap,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10",
    sentiment: "bullish",
  },
  momentum_down: {
    label: "Momentum négatif",
    icon: Target,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-500/10",
    sentiment: "bearish",
  },
};

export function SignalsWidget({ series, onSeriesClick, className }: SignalsWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAllSignals, setShowAllSignals] = useState(false);

  const { signals, allSignals, advanced } = useMemo(() => {
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

    const allSignals = [...result];
    const limitedSignals = result.slice(0, 8);

    // ═══════════════════════════════════════════════════════════════
    // INDICATEURS AVANCÉS POUR LA VUE DÉTAILLÉE
    // ═══════════════════════════════════════════════════════════════

    // Comptage par sentiment
    const bullishSignals = allSignals.filter((s) => signalConfig[s.type].sentiment === "bullish");
    const bearishSignals = allSignals.filter((s) => signalConfig[s.type].sentiment === "bearish");
    const strongSignals = allSignals.filter((s) => s.strength === "strong");

    // Score de conviction global (0-100)
    // Plus de signaux forts et alignés = meilleure conviction
    let convictionScore = 50;
    const signalBalance = bullishSignals.length - bearishSignals.length;
    convictionScore += signalBalance * 5; // ±5 par signal
    convictionScore += strongSignals.length * 3; // +3 par signal fort
    convictionScore = Math.max(0, Math.min(100, convictionScore));

    // Biais du marché
    const totalSignals = allSignals.length;
    const bullishRatio = totalSignals > 0 ? bullishSignals.length / totalSignals : 0.5;
    const bearishRatio = totalSignals > 0 ? bearishSignals.length / totalSignals : 0.5;

    // Comptage par type de signal
    const countByType: Record<SignalType, number> = {
      oversold: 0,
      overbought: 0,
      breakout_up: 0,
      breakout_down: 0,
      momentum_up: 0,
      momentum_down: 0,
    };
    allSignals.forEach((s) => {
      countByType[s.type]++;
    });

    // Couverture des signaux (% de séries avec au moins un signal)
    const seriesWithSignals = new Set(allSignals.map((s) => s.series.seriesName));
    const signalCoverage = series.length > 0 ? (seriesWithSignals.size / series.length) * 100 : 0;

    // RSI moyen des séries avec signaux
    const signalSeriesRsi = allSignals
      .map((s) => s.series.metrics.rsi14)
      .filter((x): x is number => x != null);
    const avgSignalRsi = signalSeriesRsi.length > 0
      ? signalSeriesRsi.reduce((sum, r) => sum + r, 0) / signalSeriesRsi.length
      : null;

    // Rendement moyen des séries avec signaux bullish vs bearish
    const bullishReturns = bullishSignals
      .map((s) => s.series.metrics.return7d)
      .filter((x): x is number => x != null);
    const avgBullishReturn = bullishReturns.length > 0
      ? bullishReturns.reduce((sum, r) => sum + r, 0) / bullishReturns.length
      : null;

    const bearishReturns = bearishSignals
      .map((s) => s.series.metrics.return7d)
      .filter((x): x is number => x != null);
    const avgBearishReturn = bearishReturns.length > 0
      ? bearishReturns.reduce((sum, r) => sum + r, 0) / bearishReturns.length
      : null;

    // Signaux par type
    const signalsByType = Object.entries(countByType)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    return {
      signals: limitedSignals,
      allSignals,
      advanced: {
        totalSignals,
        bullishCount: bullishSignals.length,
        bearishCount: bearishSignals.length,
        strongCount: strongSignals.length,
        moderateCount: allSignals.length - strongSignals.length,
        convictionScore,
        bullishRatio,
        bearishRatio,
        signalCoverage,
        avgSignalRsi,
        avgBullishReturn,
        avgBearishReturn,
        countByType,
        signalsByType,
        hiddenSignals: allSignals.length - limitedSignals.length,
      },
    };
  }, [series]);

  // Group signals by type for summary
  const signalSummary = useMemo(() => {
    const counts: Partial<Record<SignalType, number>> = {};
    signals.forEach((s) => {
      counts[s.type] = (counts[s.type] || 0) + 1;
    });
    return counts;
  }, [signals]);

  const getConvictionColor = (score: number) => {
    if (score <= 30) return "text-red-500";
    if (score <= 45) return "text-orange-500";
    if (score <= 55) return "text-slate-400";
    if (score <= 70) return "text-emerald-500";
    return "text-green-500";
  };

  const getConvictionLabel = (bullishRatio: number) => {
    if (bullishRatio > 0.7) return "Très haussier";
    if (bullishRatio > 0.55) return "Haussier";
    if (bullishRatio < 0.3) return "Très baissier";
    if (bullishRatio < 0.45) return "Baissier";
    return "Neutre";
  };

  return (
    <TooltipProvider>
      <Card className={cn("border-border/50 shadow-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-primary" />
            Signaux Actifs
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {advanced.totalSignals}
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
              <div className="space-y-1 max-h-[300px] overflow-y-auto px-0.5">
                {(showAllSignals ? allSignals : signals).map((signal, idx) => {
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
                      <div className="min-w-0 flex-1 ml-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium capitalize truncate pl-0.5">
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

              {advanced.hiddenSignals > 0 && (
                <button
                  onClick={() => setShowAllSignals(!showAllSignals)}
                  className="w-full text-[10px] text-primary hover:text-primary/80 text-center pt-1 font-medium"
                >
                  {showAllSignals
                    ? "Afficher moins"
                    : `+${advanced.hiddenSignals} signaux supplémentaires`
                  }
                </button>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════ */}
          {/* BOUTON EXPAND */}
          {/* ═══════════════════════════════════════════════════════ */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-1 py-1.5 mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50"
          >
            {isExpanded ? (
              <>
                Masquer l'analyse avancée <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Analyse avancée <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* SECTION DÉTAILS AVANCÉS */}
          {/* ═══════════════════════════════════════════════════════ */}
          {isExpanded && (
            <div className="space-y-4 pt-3 animate-in slide-in-from-top-2 duration-200">
              {/* Score de conviction */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Conviction du marché
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          advanced.convictionScore <= 30 ? "bg-red-500" :
                          advanced.convictionScore <= 45 ? "bg-orange-500" :
                          advanced.convictionScore <= 55 ? "bg-slate-500" :
                          advanced.convictionScore <= 70 ? "bg-emerald-500" : "bg-green-500"
                        )}
                        style={{ width: `${advanced.convictionScore}%` }}
                      />
                    </div>
                  </div>
                  <span className={cn("text-sm font-bold tabular-nums", getConvictionColor(advanced.convictionScore))}>
                    {advanced.convictionScore}/100
                  </span>
                </div>
                <p className={cn("text-xs font-medium", getConvictionColor(advanced.convictionScore))}>
                  Biais {getConvictionLabel(advanced.bullishRatio)}
                </p>
              </div>

              {/* Balance haussier/baissier */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Balance des signaux
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2 rounded bg-success/10 border border-success/20 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-success" />
                      <span className="text-lg font-bold text-success tabular-nums">
                        {advanced.bullishCount}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Haussiers</p>
                    <p className="text-[9px] text-success font-medium">
                      {(advanced.bullishRatio * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="flex-1 p-2 rounded bg-destructive/10 border border-destructive/20 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                      <span className="text-lg font-bold text-destructive tabular-nums">
                        {advanced.bearishCount}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Baissiers</p>
                    <p className="text-[9px] text-destructive font-medium">
                      {(advanced.bearishRatio * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Force des signaux */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Force des signaux
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-1.5 rounded bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-primary" />
                      <span className="text-[9px] text-muted-foreground">Forts</span>
                    </div>
                    <p className="text-xs font-bold tabular-nums text-primary">
                      {advanced.strongCount}
                    </p>
                  </div>
                  <div className="p-1.5 rounded bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-1">
                      <Activity className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">Modérés</span>
                    </div>
                    <p className="text-xs font-bold tabular-nums">
                      {advanced.moderateCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Métriques supplémentaires */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Métriques des signaux
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="p-1.5 rounded bg-muted/30 border border-border/30 cursor-help">
                        <span className="text-[9px] text-muted-foreground">Couverture</span>
                        <p className="text-xs font-bold tabular-nums">
                          {advanced.signalCoverage.toFixed(0)}%
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">% de séries avec au moins un signal actif</p>
                    </TooltipContent>
                  </Tooltip>

                  {advanced.avgSignalRsi != null && (
                    <div className="p-1.5 rounded bg-muted/30 border border-border/30">
                      <span className="text-[9px] text-muted-foreground">RSI moyen</span>
                      <p className={cn(
                        "text-xs font-bold tabular-nums",
                        advanced.avgSignalRsi < 40 ? "text-emerald-500" :
                        advanced.avgSignalRsi > 60 ? "text-amber-500" : ""
                      )}>
                        {advanced.avgSignalRsi.toFixed(0)}
                      </p>
                    </div>
                  )}

                  {advanced.avgBullishReturn != null && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-1.5 rounded bg-success/10 border border-success/20 cursor-help">
                          <span className="text-[9px] text-muted-foreground">Rend. haussiers</span>
                          <p className="text-xs font-bold tabular-nums text-success">
                            {advanced.avgBullishReturn >= 0 ? "+" : ""}
                            {(advanced.avgBullishReturn * 100).toFixed(1)}%
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Rendement 7j moyen des séries avec signaux haussiers</p>
                      </TooltipContent>
                    </Tooltip>
                  )}

                  {advanced.avgBearishReturn != null && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-1.5 rounded bg-destructive/10 border border-destructive/20 cursor-help">
                          <span className="text-[9px] text-muted-foreground">Rend. baissiers</span>
                          <p className="text-xs font-bold tabular-nums text-destructive">
                            {advanced.avgBearishReturn >= 0 ? "+" : ""}
                            {(advanced.avgBearishReturn * 100).toFixed(1)}%
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Rendement 7j moyen des séries avec signaux baissiers</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Répartition par type */}
              {advanced.signalsByType.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Répartition par type
                  </p>
                  <div className="space-y-1">
                    {advanced.signalsByType.map(([type, count]) => {
                      const config = signalConfig[type as SignalType];
                      const percentage = advanced.totalSignals > 0 ? (count / advanced.totalSignals) * 100 : 0;
                      return (
                        <div key={type} className="flex items-center gap-2">
                          <div className={cn("p-1 rounded", config.bgColor)}>
                            <config.icon className={cn("w-2.5 h-2.5", config.color)} />
                          </div>
                          <span className="text-[10px] text-muted-foreground flex-1 truncate">
                            {config.label}
                          </span>
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                config.sentiment === "bullish" ? "bg-emerald-500" : "bg-red-500"
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-medium tabular-nums w-6 text-right">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
