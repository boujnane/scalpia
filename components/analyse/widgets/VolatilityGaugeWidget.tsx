"use client";

import { useMemo, useState } from "react";
import { Activity, Info, AlertTriangle, Shield, Zap, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

interface VolatilityGaugeWidgetProps {
  series: SeriesFinanceSummary[];
  className?: string;
}

type VolLevel = "very_low" | "low" | "moderate" | "high" | "very_high";

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * (sorted.length - 1));
  return sorted[idx];
}

export function VolatilityGaugeWidget({ series, className }: VolatilityGaugeWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const volatility = useMemo(() => {
    const validSeries = series.filter((s) => s.metrics.vol30d != null);
    if (validSeries.length === 0) return null;

    const vols = validSeries.map((s) => s.metrics.vol30d ?? 0);
    const avgVol = vols.reduce((sum, v) => sum + v, 0) / vols.length;

    const maxVolSeries = validSeries.reduce((max, s) =>
      (s.metrics.vol30d ?? 0) > (max.metrics.vol30d ?? 0) ? s : max
    , validSeries[0]);

    const minVolSeries = validSeries.reduce((min, s) =>
      (s.metrics.vol30d ?? 0) < (min.metrics.vol30d ?? 0) ? s : min
    , validSeries[0]);

    const veryLow = validSeries.filter((s) => (s.metrics.vol30d ?? 0) < 0.02).length;
    const low = validSeries.filter((s) => (s.metrics.vol30d ?? 0) >= 0.02 && (s.metrics.vol30d ?? 0) < 0.04).length;
    const moderate = validSeries.filter((s) => (s.metrics.vol30d ?? 0) >= 0.04 && (s.metrics.vol30d ?? 0) < 0.07).length;
    const high = validSeries.filter((s) => (s.metrics.vol30d ?? 0) >= 0.07 && (s.metrics.vol30d ?? 0) < 0.10).length;
    const veryHigh = validSeries.filter((s) => (s.metrics.vol30d ?? 0) >= 0.10).length;

    let level: VolLevel;
    let label: string;
    let color: string;
    let description: string;

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

    // ═══════════════════════════════════════════════════════════════
    // INDICATEURS AVANCÉS POUR LA VUE DÉTAILLÉE
    // ═══════════════════════════════════════════════════════════════

    // Médiane et percentiles de volatilité
    const medianVol = median(vols) ?? avgVol;
    const p25Vol = percentile(vols, 25) ?? 0;
    const p75Vol = percentile(vols, 75) ?? 0;
    const volSpread = p75Vol - p25Vol; // Écart interquartile

    // VaR et CVaR moyens du marché
    const validVaR = validSeries
      .map((s) => s.metrics.var95)
      .filter((x): x is number => x != null);
    const avgVaR = validVaR.length > 0
      ? validVaR.reduce((sum, v) => sum + v, 0) / validVaR.length
      : null;

    const validCVaR = validSeries
      .map((s) => s.metrics.cvar95)
      .filter((x): x is number => x != null);
    const avgCVaR = validCVaR.length > 0
      ? validCVaR.reduce((sum, v) => sum + v, 0) / validCVaR.length
      : null;

    // Max Drawdown moyen
    const validDrawdown = validSeries
      .map((s) => s.metrics.maxDrawdown90d)
      .filter((x): x is number => x != null);
    const avgDrawdown = validDrawdown.length > 0
      ? validDrawdown.reduce((sum, d) => sum + d, 0) / validDrawdown.length
      : null;

    // Skewness et Kurtosis moyens (asymétrie et queues de distribution)
    const validSkew = validSeries
      .map((s) => s.metrics.skewness)
      .filter((x): x is number => x != null);
    const avgSkewness = validSkew.length > 0
      ? validSkew.reduce((sum, s) => sum + s, 0) / validSkew.length
      : null;

    const validKurt = validSeries
      .map((s) => s.metrics.kurtosis)
      .filter((x): x is number => x != null);
    const avgKurtosis = validKurt.length > 0
      ? validKurt.reduce((sum, k) => sum + k, 0) / validKurt.length
      : null;

    // Volatilité annualisée moyenne
    const validVolAnn = validSeries
      .map((s) => s.metrics.volAnnualized)
      .filter((x): x is number => x != null);
    const avgVolAnnualized = validVolAnn.length > 0
      ? validVolAnn.reduce((sum, v) => sum + v, 0) / validVolAnn.length
      : null;

    // Ratio vol haussière / vol baissière
    const upVol = validSeries.filter((s) => s.trend7d === "up");
    const downVol = validSeries.filter((s) => s.trend7d === "down");
    const avgUpVol = upVol.length > 0
      ? upVol.reduce((sum, s) => sum + (s.metrics.vol30d ?? 0), 0) / upVol.length
      : 0;
    const avgDownVol = downVol.length > 0
      ? downVol.reduce((sum, s) => sum + (s.metrics.vol30d ?? 0), 0) / downVol.length
      : 0;

    // Score de risque global (0-100)
    // Basé sur: vol moyenne, VaR, drawdown, kurtosis
    let riskScore = 50;
    // Vol component (40%)
    if (avgVol < 0.02) riskScore -= 20;
    else if (avgVol < 0.04) riskScore -= 10;
    else if (avgVol > 0.10) riskScore += 20;
    else if (avgVol > 0.07) riskScore += 10;
    // VaR component (30%)
    if (avgVaR != null) {
      if (avgVaR < 0.03) riskScore -= 15;
      else if (avgVaR > 0.08) riskScore += 15;
    }
    // Drawdown component (30%)
    if (avgDrawdown != null) {
      if (avgDrawdown < 0.10) riskScore -= 15;
      else if (avgDrawdown > 0.25) riskScore += 15;
    }
    riskScore = Math.max(0, Math.min(100, riskScore));

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
      // Indicateurs avancés
      advanced: {
        medianVol,
        p25Vol,
        p75Vol,
        volSpread,
        avgVaR,
        avgCVaR,
        avgDrawdown,
        avgSkewness,
        avgKurtosis,
        avgVolAnnualized,
        avgUpVol,
        avgDownVol,
        riskScore,
      },
    };
  }, [series]);

  if (!volatility) {
    return null;
  }

  const maxCount = Math.max(
    volatility.distribution.veryLow,
    volatility.distribution.low,
    volatility.distribution.moderate,
    volatility.distribution.high,
    volatility.distribution.veryHigh,
    1
  );

  const getRiskColor = (score: number) => {
    if (score <= 30) return "text-emerald-500";
    if (score <= 50) return "text-yellow-500";
    if (score <= 70) return "text-orange-500";
    return "text-red-500";
  };

  const getRiskLabel = (score: number) => {
    if (score <= 30) return "Faible";
    if (score <= 50) return "Modéré";
    if (score <= 70) return "Élevé";
    return "Très élevé";
  };

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

          {/* ═══════════════════════════════════════════════════════ */}
          {/* BOUTON EXPAND */}
          {/* ═══════════════════════════════════════════════════════ */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50"
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
            <div className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-200">
              {/* Score de risque global */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Score de risque global
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          volatility.advanced.riskScore <= 30 ? "bg-emerald-500" :
                          volatility.advanced.riskScore <= 50 ? "bg-yellow-500" :
                          volatility.advanced.riskScore <= 70 ? "bg-orange-500" : "bg-red-500"
                        )}
                        style={{ width: `${volatility.advanced.riskScore}%` }}
                      />
                    </div>
                  </div>
                  <span className={cn("text-sm font-bold tabular-nums", getRiskColor(volatility.advanced.riskScore))}>
                    {volatility.advanced.riskScore}/100
                  </span>
                </div>
                <p className={cn("text-xs font-medium", getRiskColor(volatility.advanced.riskScore))}>
                  Risque {getRiskLabel(volatility.advanced.riskScore)}
                </p>
              </div>

              {/* Statistiques de volatilité */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Statistiques de volatilité
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-1.5 rounded bg-muted/30 border border-border/30">
                    <span className="text-[9px] text-muted-foreground">Médiane</span>
                    <p className="text-xs font-bold tabular-nums">
                      {(volatility.advanced.medianVol * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-1.5 rounded bg-muted/30 border border-border/30">
                    <span className="text-[9px] text-muted-foreground">Écart IQ</span>
                    <p className="text-xs font-bold tabular-nums">
                      {(volatility.advanced.volSpread * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-1.5 rounded bg-muted/30 border border-border/30">
                    <span className="text-[9px] text-muted-foreground">P25</span>
                    <p className="text-xs font-bold tabular-nums text-emerald-500">
                      {(volatility.advanced.p25Vol * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-1.5 rounded bg-muted/30 border border-border/30">
                    <span className="text-[9px] text-muted-foreground">P75</span>
                    <p className="text-xs font-bold tabular-nums text-orange-500">
                      {(volatility.advanced.p75Vol * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Indicateurs de risque */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Indicateurs de risque
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {volatility.advanced.avgVaR != null && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-1.5 rounded bg-muted/30 border border-border/30 cursor-help">
                          <span className="text-[9px] text-muted-foreground">VaR 95%</span>
                          <p className="text-xs font-bold tabular-nums text-amber-500">
                            -{(volatility.advanced.avgVaR * 100).toFixed(1)}%
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Perte maximale probable (95% confiance)</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {volatility.advanced.avgCVaR != null && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-1.5 rounded bg-muted/30 border border-border/30 cursor-help">
                          <span className="text-[9px] text-muted-foreground">CVaR 95%</span>
                          <p className="text-xs font-bold tabular-nums text-red-500">
                            -{(volatility.advanced.avgCVaR * 100).toFixed(1)}%
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Perte moyenne dans les pires scénarios</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {volatility.advanced.avgDrawdown != null && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-1.5 rounded bg-muted/30 border border-border/30 cursor-help">
                          <span className="text-[9px] text-muted-foreground">Drawdown moy.</span>
                          <p className="text-xs font-bold tabular-nums text-destructive">
                            -{(volatility.advanced.avgDrawdown * 100).toFixed(1)}%
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Baisse moyenne depuis les plus hauts (90j)</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {volatility.advanced.avgVolAnnualized != null && (
                    <div className="p-1.5 rounded bg-muted/30 border border-border/30">
                      <span className="text-[9px] text-muted-foreground">Vol. annualisée</span>
                      <p className="text-xs font-bold tabular-nums">
                        {(volatility.advanced.avgVolAnnualized * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Asymétrie du marché */}
              {(volatility.advanced.avgSkewness != null || volatility.advanced.avgKurtosis != null) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Forme de la distribution
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {volatility.advanced.avgSkewness != null && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-1.5 rounded bg-muted/30 border border-border/30 cursor-help">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-muted-foreground">Asymétrie</span>
                              {volatility.advanced.avgSkewness < -0.5 ? (
                                <TrendingDown className="w-2.5 h-2.5 text-red-500" />
                              ) : volatility.advanced.avgSkewness > 0.5 ? (
                                <TrendingUp className="w-2.5 h-2.5 text-emerald-500" />
                              ) : (
                                <Minus className="w-2.5 h-2.5 text-muted-foreground" />
                              )}
                            </div>
                            <p className={cn(
                              "text-xs font-bold tabular-nums",
                              volatility.advanced.avgSkewness < -0.5 ? "text-red-500" :
                              volatility.advanced.avgSkewness > 0.5 ? "text-emerald-500" : ""
                            )}>
                              {volatility.advanced.avgSkewness.toFixed(2)}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {volatility.advanced.avgSkewness < -0.5
                              ? "Négatif: plus de baisses extrêmes"
                              : volatility.advanced.avgSkewness > 0.5
                                ? "Positif: plus de hausses extrêmes"
                                : "Symétrique"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {volatility.advanced.avgKurtosis != null && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-1.5 rounded bg-muted/30 border border-border/30 cursor-help">
                            <span className="text-[9px] text-muted-foreground">Kurtosis</span>
                            <p className={cn(
                              "text-xs font-bold tabular-nums",
                              volatility.advanced.avgKurtosis > 3 ? "text-amber-500" : ""
                            )}>
                              {volatility.advanced.avgKurtosis.toFixed(2)}
                            </p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {volatility.advanced.avgKurtosis > 3
                              ? "Queues épaisses: mouvements extrêmes plus fréquents"
                              : "Distribution normale"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              )}

              {/* Vol haussière vs baissière */}
              {(volatility.advanced.avgUpVol > 0 || volatility.advanced.avgDownVol > 0) && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Volatilité par tendance
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-1.5 rounded bg-success/10 border border-success/20">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-success" />
                        <span className="text-[9px] text-muted-foreground">Haussiers</span>
                      </div>
                      <p className="text-xs font-bold tabular-nums text-success">
                        {(volatility.advanced.avgUpVol * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex-1 p-1.5 rounded bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-destructive" />
                        <span className="text-[9px] text-muted-foreground">Baissiers</span>
                      </div>
                      <p className="text-xs font-bold tabular-nums text-destructive">
                        {(volatility.advanced.avgDownVol * 100).toFixed(1)}%
                      </p>
                    </div>
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
