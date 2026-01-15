"use client";

import React from "react";
import {
  Shield,
  TrendingUp,
  Activity,
  BarChart2,
  AlertTriangle,
  Target,
  Info,
} from "lucide-react";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MetricCard,
  MetricRow,
  MetricGroup,
  RSIIndicator,
} from "./MetricCard";
import type { FinanceMetrics } from "@/lib/analyse/finance/types";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface AdvancedMetricsPanelProps {
  metrics: FinanceMetrics;
  seriesName?: string;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getRiskLevel(metrics: FinanceMetrics): {
  level: "low" | "medium" | "high";
  label: string;
  color: string;
} {
  const { vol30d, maxDrawdown90d } = metrics;

  let riskScore = 0;

  if (vol30d != null) {
    if (vol30d > 0.1) riskScore += 3;
    else if (vol30d > 0.05) riskScore += 1;
  }

  if (maxDrawdown90d != null) {
    if (maxDrawdown90d > 0.3) riskScore += 3;
    else if (maxDrawdown90d > 0.15) riskScore += 1;
  }

  if (riskScore >= 5) {
    return { level: "high", label: "Risque élevé", color: "text-destructive" };
  } else if (riskScore >= 2) {
    return { level: "medium", label: "Risque modéré", color: "text-warning" };
  }
  return { level: "low", label: "Risque faible", color: "text-success" };
}

function getPerformanceQuality(metrics: FinanceMetrics): {
  quality: "excellent" | "good" | "average" | "poor";
  label: string;
  color: string;
} {
  const { sharpeRatio, return30d, premiumNow } = metrics;

  let score = 0;

  // Ratio Rendement/Vol (ex-Sharpe)
  if (sharpeRatio != null) {
    if (sharpeRatio > 1) score += 3;
    else if (sharpeRatio > 0.5) score += 1;
    else if (sharpeRatio < 0) score -= 1;
  }

  // Rendement 30j
  if (return30d != null) {
    if (return30d > 0.1) score += 2;
    else if (return30d > 0.03) score += 1;
    else if (return30d < -0.05) score -= 1;
  }

  // Premium (valorisation)
  if (premiumNow != null) {
    if (premiumNow > 0.5) score += 2;
    else if (premiumNow > 0.2) score += 1;
    else if (premiumNow < 0) score -= 1;
  }

  if (score >= 5) {
    return { quality: "excellent", label: "Excellente", color: "text-success" };
  } else if (score >= 2) {
    return { quality: "good", label: "Bonne", color: "text-primary" };
  } else if (score >= 0) {
    return { quality: "average", label: "Moyenne", color: "text-muted-foreground" };
  }
  return { quality: "poor", label: "Faible", color: "text-destructive" };
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function AdvancedMetricsPanel({
  metrics,
  seriesName,
  className,
}: AdvancedMetricsPanelProps) {
  const riskLevel = getRiskLevel(metrics);
  const performance = getPerformanceQuality(metrics);

  return (
    <TooltipProvider>
      <div className={cn("space-y-6", className)}>
        {/* En-tête avec résumé */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Score Global"
            value={metrics.score}
            suffix="/100"
            termKey="score"
            variant={
              metrics.score != null
                ? metrics.score >= 70
                  ? "positive"
                  : metrics.score >= 50
                  ? "default"
                  : "negative"
                : "default"
            }
            size="sm"
          />
          <MetricCard
            label="Performance"
            value={performance.label}
            variant={
              performance.quality === "excellent"
                ? "positive"
                : performance.quality === "poor"
                ? "negative"
                : "default"
            }
            size="sm"
          />
          <MetricCard
            label="Niveau de risque"
            value={riskLevel.label}
            variant={
              riskLevel.level === "low"
                ? "positive"
                : riskLevel.level === "high"
                ? "negative"
                : "warning"
            }
            size="sm"
          />
          <MetricCard
            label="RSI Signal"
            value={
              metrics.rsiSignal === "oversold"
                ? "Survendu"
                : metrics.rsiSignal === "overbought"
                ? "Suracheté"
                : "Neutre"
            }
            variant={
              metrics.rsiSignal === "oversold"
                ? "positive"
                : metrics.rsiSignal === "overbought"
                ? "warning"
                : "default"
            }
            size="sm"
          />
        </div>

        {/* Tabs pour les différentes catégories */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList className="bg-muted/50 p-1 grid grid-cols-3 sm:inline-flex w-full sm:w-auto">
            <TabsTrigger value="performance" className="text-xs sm:text-sm">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="risk" className="text-xs sm:text-sm">
              <Shield className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
              Risque
            </TabsTrigger>
            <TabsTrigger value="momentum" className="text-xs sm:text-sm">
              <Activity className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />
              Momentum
            </TabsTrigger>
          </TabsList>

          {/* TAB: Performance */}
          <TabsContent value="performance" className="space-y-4 animate-in fade-in-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ratios de performance */}
              <MetricGroup
                title="Ratios de Performance"
                description="Rendement ajusté au risque (adapté au marché scellé)"
                icon={<BarChart2 className="w-4 h-4 text-primary" />}
              >
                <div className="space-y-3">
                  <RatioDisplay
                    label="Rendement / Volatilité"
                    value={metrics.sharpeRatio}
                    description="Plus le ratio est élevé, meilleur est le rendement par rapport au risque"
                    thresholds={{ excellent: 1, good: 0.5, bad: 0 }}
                  />
                  <RatioDisplay
                    label="Rendement / Baisse"
                    value={metrics.sortinoRatio}
                    description="Ne pénalise que les baisses (plus pertinent)"
                    thresholds={{ excellent: 1.5, good: 0.5, bad: 0 }}
                  />
                  <RatioDisplay
                    label="Rendement / Max Drawdown"
                    value={metrics.calmarRatio}
                    description="Capacité à générer des gains vs pertes subies"
                    thresholds={{ excellent: 2, good: 0.5, bad: -1 }}
                  />
                </div>
              </MetricGroup>

              {/* Rendements */}
              <MetricGroup
                title="Rendements & Valorisation"
                description="Performance sur différentes périodes"
                icon={<TrendingUp className="w-4 h-4 text-primary" />}
              >
                <MetricRow
                  label="Variation 7 jours"
                  value={metrics.return7d}
                  suffix="%"
                  termKey="return7d"
                  variant={
                    metrics.return7d != null
                      ? metrics.return7d > 0.02
                        ? "positive"
                        : metrics.return7d < -0.02
                        ? "negative"
                        : "default"
                      : "default"
                  }
                />
                <MetricRow
                  label="Variation 30 jours"
                  value={metrics.return30d}
                  suffix="%"
                  termKey="return30d"
                  variant={
                    metrics.return30d != null
                      ? metrics.return30d > 0.05
                        ? "positive"
                        : metrics.return30d < -0.05
                        ? "negative"
                        : "default"
                      : "default"
                  }
                />
                <MetricRow
                  label="Surcote vs retail"
                  value={metrics.premiumNow}
                  suffix="%"
                  termKey="premiumNow"
                  variant={
                    metrics.premiumNow != null
                      ? metrics.premiumNow > 0.3
                        ? "positive"
                        : metrics.premiumNow < 0
                        ? "negative"
                        : "default"
                      : "default"
                  }
                />
                <MetricRow
                  label="Tendance de fond"
                  value={
                    metrics.slope30d != null
                      ? metrics.slope30d > 0.001
                        ? "Haussière"
                        : metrics.slope30d < -0.001
                        ? "Baissière"
                        : "Stable"
                      : null
                  }
                  termKey="slope"
                  variant={
                    metrics.slope30d != null
                      ? metrics.slope30d > 0.001
                        ? "positive"
                        : metrics.slope30d < -0.001
                        ? "negative"
                        : "default"
                      : "default"
                  }
                />
              </MetricGroup>
            </div>
          </TabsContent>

          {/* TAB: Analyse de risque */}
          <TabsContent value="risk" className="space-y-4 animate-in fade-in-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Volatilité */}
              <MetricGroup
                title="Stabilité des prix"
                description="Amplitude des variations de prix"
                icon={<Activity className="w-4 h-4 text-primary" />}
              >
                <MetricRow
                  label="Volatilité 30 jours"
                  value={metrics.vol30d}
                  suffix="%"
                  termKey="volatility"
                  variant={
                    metrics.vol30d != null
                      ? metrics.vol30d > 0.08
                        ? "negative"
                        : metrics.vol30d < 0.03
                        ? "positive"
                        : "default"
                      : "default"
                  }
                  showBar
                  barValue={metrics.vol30d != null ? metrics.vol30d * 100 : 0}
                  barMax={15}
                />
                <MetricRow
                  label="Volatilité annualisée"
                  value={metrics.volAnnualized}
                  suffix="%"
                  termKey="volAnnualized"
                  variant={
                    metrics.volAnnualized != null
                      ? metrics.volAnnualized > 0.5
                        ? "negative"
                        : metrics.volAnnualized < 0.2
                        ? "positive"
                        : "default"
                      : "default"
                  }
                />
                <MetricRow
                  label="Volatilité négative"
                  value={metrics.downsideVol}
                  suffix="%"
                  termKey="downsideVol"
                  variant={
                    metrics.downsideVol != null
                      ? metrics.downsideVol > 0.05
                        ? "negative"
                        : "positive"
                      : "default"
                  }
                />
              </MetricGroup>

              {/* Risques */}
              <MetricGroup
                title="Exposition au risque"
                description="Pertes potentielles observées"
                icon={<AlertTriangle className="w-4 h-4 text-warning" />}
              >
                <MetricRow
                  label="Plus forte baisse (90j)"
                  value={metrics.maxDrawdown90d}
                  suffix="%"
                  termKey="maxDrawdown"
                  variant={
                    metrics.maxDrawdown90d != null
                      ? metrics.maxDrawdown90d > 0.2
                        ? "negative"
                        : metrics.maxDrawdown90d < 0.1
                        ? "positive"
                        : "default"
                      : "default"
                  }
                  showBar
                  barValue={metrics.maxDrawdown90d != null ? metrics.maxDrawdown90d * 100 : 0}
                  barMax={50}
                />

                {/* Asymétrie des rendements */}
                <div className="p-3 rounded-lg bg-muted/50 mt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Asymétrie</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-muted-foreground/50 hover:text-muted-foreground">
                            <Info className="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-semibold mb-1">Asymétrie des variations</p>
                          <p className="text-xs text-muted-foreground">
                            Positive = plus de hausses extrêmes. Négative = plus de baisses extrêmes (plus risqué).
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        metrics.skewness != null
                          ? metrics.skewness > 0.3
                            ? "text-success"
                            : metrics.skewness < -0.3
                            ? "text-destructive"
                            : "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {metrics.skewness != null ? metrics.skewness.toFixed(2) : "N/A"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.skewness != null
                      ? metrics.skewness > 0.3
                        ? "Tendance à avoir plus de bonnes surprises"
                        : metrics.skewness < -0.3
                        ? "Attention : plus de mauvaises surprises possibles"
                        : "Distribution équilibrée des variations"
                      : "Données insuffisantes"}
                  </p>
                </div>
              </MetricGroup>
            </div>
          </TabsContent>

          {/* TAB: Momentum */}
          <TabsContent value="momentum" className="space-y-4 animate-in fade-in-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* RSI */}
              <RSIIndicator value={metrics.rsi14} signal={metrics.rsiSignal} />

              {/* Interprétation */}
              <MetricGroup
                title="Interprétation"
                description="Signaux et recommandations"
                icon={<Target className="w-4 h-4 text-primary" />}
              >
                <div className="space-y-3">
                  {/* Signal RSI */}
                  {metrics.rsiSignal === "oversold" && (
                    <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                      <p className="text-sm font-medium text-success">Zone de survente</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Le RSI bas ({metrics.rsi14?.toFixed(0)}) suggère un potentiel rebond.
                        Historiquement, c'est souvent un bon point d'entrée.
                      </p>
                    </div>
                  )}

                  {metrics.rsiSignal === "overbought" && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                      <p className="text-sm font-medium text-warning">Zone de surachat</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Le RSI élevé ({metrics.rsi14?.toFixed(0)}) indique une possible correction.
                        Prudence si vous envisagez d'acheter maintenant.
                      </p>
                    </div>
                  )}

                  {metrics.rsiSignal === "neutral" && (
                    <div className="p-3 rounded-lg bg-muted border border-border">
                      <p className="text-sm font-medium text-foreground">Zone neutre</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Le RSI ({metrics.rsi14?.toFixed(0)}) est dans une zone équilibrée.
                        Pas de signal fort d'achat ou de vente.
                      </p>
                    </div>
                  )}

                  {metrics.rsiSignal == null && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-sm font-medium text-muted-foreground">Données insuffisantes</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pas assez de points de données pour calculer le RSI.
                        Au moins 5 points sont nécessaires.
                      </p>
                    </div>
                  )}

                  {/* Signal tendance */}
                  {metrics.slope30d != null && (
                    <div
                      className={cn(
                        "p-3 rounded-lg border",
                        metrics.slope30d > 0.001
                          ? "bg-success/10 border-success/30"
                          : metrics.slope30d < -0.001
                          ? "bg-destructive/10 border-destructive/30"
                          : "bg-muted border-border"
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm font-medium",
                          metrics.slope30d > 0.001
                            ? "text-success"
                            : metrics.slope30d < -0.001
                            ? "text-destructive"
                            : "text-foreground"
                        )}
                      >
                        Tendance{" "}
                        {metrics.slope30d > 0.001
                          ? "haussière"
                          : metrics.slope30d < -0.001
                          ? "baissière"
                          : "stable"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        La régression sur les données montre une direction{" "}
                        {metrics.slope30d > 0 ? "positive" : metrics.slope30d < 0 ? "négative" : "neutre"}
                        {" "}du prix.
                      </p>
                    </div>
                  )}
                </div>
              </MetricGroup>
            </div>
          </TabsContent>
        </Tabs>

        {/* Qualité des données */}
        <div className="p-4 rounded-xl border border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Qualité des données</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Coverage 30j</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      metrics.coverage30d >= 0.9 ? "bg-success" : metrics.coverage30d >= 0.6 ? "bg-warning" : "bg-destructive"
                    )}
                    style={{ width: `${metrics.coverage30d * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums">
                  {(metrics.coverage30d * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fraîcheur</p>
              <p
                className={cn(
                  "text-sm font-medium mt-1",
                  metrics.freshnessDays != null
                    ? metrics.freshnessDays <= 2
                      ? "text-success"
                      : metrics.freshnessDays <= 7
                      ? "text-warning"
                      : "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {metrics.freshnessDays != null ? `${metrics.freshnessDays} jour(s)` : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Note explicative */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Note :</span> Ces indicateurs sont adaptés au marché du scellé Pokémon.
              Les données sont basées sur les prix les plus bas constatés quotidiennement.
              Le RSI utilise tous les points de données disponibles (minimum 5 points requis).
            </p>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// COMPOSANTS INTERNES
// ============================================================================

function RatioDisplay({
  label,
  value,
  description,
  thresholds,
}: {
  label: string;
  value: number | null;
  description: string;
  thresholds: { excellent: number; good: number; bad: number };
}) {
  let qualityLabel = "Neutre";
  let colorClass = "text-foreground";

  if (value != null) {
    if (value >= thresholds.excellent) {
      qualityLabel = "Excellent";
      colorClass = "text-success";
    } else if (value >= thresholds.good) {
      qualityLabel = "Bon";
      colorClass = "text-primary";
    } else if (value <= thresholds.bad) {
      qualityLabel = "Faible";
      colorClass = "text-destructive";
    }
  }

  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground/50 hover:text-muted-foreground">
              <Info className="w-3 h-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("text-xs px-1.5 py-0.5 rounded bg-muted", colorClass)}>
          {qualityLabel}
        </span>
        <span className={cn("text-sm font-semibold tabular-nums", colorClass)}>
          {value != null ? value.toFixed(2) : "N/A"}
        </span>
      </div>
    </div>
  );
}
