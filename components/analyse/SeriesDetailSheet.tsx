"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Shield,
  Target,
  BarChart2,
  Calendar,
  Package,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";
import { RSIIndicator } from "./MetricCard";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SeriesDetailSheetProps {
  series: SeriesFinanceSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SeriesDetailSheet({
  series,
  open,
  onOpenChange,
}: SeriesDetailSheetProps) {
  if (!series) return null;

  const { metrics } = series;

  const getTrendIcon = (trend: "up" | "down" | "stable" | "na") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatPercent = (value: number | null) => {
    if (value == null) return "N/A";
    const sign = value > 0 ? "+" : "";
    return `${sign}${(value * 100).toFixed(2)}%`;
  };

  const getScoreColor = (score: number | null) => {
    if (score == null) return "text-muted-foreground";
    if (score >= 70) return "text-success";
    if (score >= 50) return "text-primary";
    if (score >= 30) return "text-warning";
    return "text-destructive";
  };

  const getScoreLabel = (score: number | null) => {
    if (score == null) return "N/A";
    if (score >= 70) return "Excellent";
    if (score >= 50) return "Bon";
    if (score >= 30) return "Moyen";
    return "Faible";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header sticky */}
        <SheetHeader className="p-6 pb-4 border-b bg-gradient-to-r from-primary/5 to-transparent sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-xl capitalize">{series.seriesName}</SheetTitle>
              <SheetDescription className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  {series.itemsCount} produit(s)
                </span>
                <span className="flex items-center gap-1">
                  <BarChart2 className="w-3.5 h-3.5" />
                  {series.indexPointsCount} points
                </span>
                {series.lastDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(series.lastDate).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(series.trend7d)}
              <Badge
                variant={
                  series.trend7d === "up"
                    ? "success"
                    : series.trend7d === "down"
                    ? "destructive"
                    : "secondary"
                }
              >
                {formatPercent(metrics.return7d)}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        {/* Contenu scrollable */}
        <ScrollArea className="flex-1">
          <TooltipProvider>
            <div className="p-6 space-y-6">
              {/* Score principal */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-card to-muted/30 border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Score Global
                  </h3>
                  <span className={cn("text-xs font-medium px-2 py-1 rounded-full bg-muted", getScoreColor(metrics.score))}>
                    {getScoreLabel(metrics.score)}
                  </span>
                </div>
                <div className="flex items-end gap-2">
                  <span className={cn("text-5xl font-extrabold tabular-nums", getScoreColor(metrics.score))}>
                    {metrics.score ?? "N/A"}
                  </span>
                  <span className="text-xl text-muted-foreground mb-1">/100</span>
                </div>
              </div>

              {/* Performance */}
              <Section
                icon={<TrendingUp className="w-4 h-4 text-primary" />}
                title="Performance"
                subtitle="Rendements et valorisation"
              >
                <MetricItem
                  label="Surcote vs retail"
                  value={formatPercent(metrics.premiumNow)}
                  variant={metrics.premiumNow != null ? (metrics.premiumNow > 0.3 ? "positive" : metrics.premiumNow < 0 ? "negative" : "default") : "default"}
                  tooltip="Écart entre le prix actuel et le prix de sortie"
                />
                <MetricItem
                  label="Variation 7 jours"
                  value={formatPercent(metrics.return7d)}
                  variant={metrics.return7d != null ? (metrics.return7d > 0.02 ? "positive" : metrics.return7d < -0.02 ? "negative" : "default") : "default"}
                />
                <MetricItem
                  label="Variation 30 jours"
                  value={formatPercent(metrics.return30d)}
                  variant={metrics.return30d != null ? (metrics.return30d > 0.05 ? "positive" : metrics.return30d < -0.05 ? "negative" : "default") : "default"}
                />
                <MetricItem
                  label="Tendance de fond"
                  value={
                    metrics.slope30d != null
                      ? metrics.slope30d > 0.001
                        ? "Haussière"
                        : metrics.slope30d < -0.001
                        ? "Baissière"
                        : "Stable"
                      : "N/A"
                  }
                  variant={metrics.slope30d != null ? (metrics.slope30d > 0.001 ? "positive" : metrics.slope30d < -0.001 ? "negative" : "default") : "default"}
                  tooltip="Direction générale des prix sur 30 jours"
                />
              </Section>

              {/* Ratios */}
              <Section
                icon={<BarChart2 className="w-4 h-4 text-primary" />}
                title="Ratios de performance"
                subtitle="Rendement ajusté au risque"
              >
                <RatioItem
                  label="Rendement / Volatilité"
                  value={metrics.sharpeRatio}
                  thresholds={{ good: 0.5, excellent: 1 }}
                />
                <RatioItem
                  label="Rendement / Baisse"
                  value={metrics.sortinoRatio}
                  thresholds={{ good: 0.5, excellent: 1.5 }}
                />
                <RatioItem
                  label="Rendement / Max Drawdown"
                  value={metrics.calmarRatio}
                  thresholds={{ good: 0.5, excellent: 2 }}
                />
              </Section>

              {/* Risque */}
              <Section
                icon={<Shield className="w-4 h-4 text-warning" />}
                title="Risque"
                subtitle="Volatilité et pertes potentielles"
              >
                <MetricItem
                  label="Volatilité 30 jours"
                  value={formatPercent(metrics.vol30d)}
                  variant={metrics.vol30d != null ? (metrics.vol30d > 0.08 ? "negative" : metrics.vol30d < 0.03 ? "positive" : "default") : "default"}
                  showBar
                  barValue={metrics.vol30d != null ? metrics.vol30d * 100 : 0}
                  barMax={15}
                />
                <MetricItem
                  label="Plus forte baisse (90j)"
                  value={formatPercent(metrics.maxDrawdown90d)}
                  variant={metrics.maxDrawdown90d != null ? (metrics.maxDrawdown90d > 0.2 ? "negative" : metrics.maxDrawdown90d < 0.1 ? "positive" : "default") : "default"}
                  showBar
                  barValue={metrics.maxDrawdown90d != null ? metrics.maxDrawdown90d * 100 : 0}
                  barMax={50}
                  tooltip="La plus grande chute de prix observée"
                />
                <MetricItem
                  label="Volatilité annualisée"
                  value={formatPercent(metrics.volAnnualized)}
                />
                {metrics.skewness != null && (
                  <div className="p-3 rounded-lg bg-muted/50 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Asymétrie</span>
                      <span className={cn("text-sm font-semibold", metrics.skewness > 0.3 ? "text-success" : metrics.skewness < -0.3 ? "text-destructive" : "text-foreground")}>
                        {metrics.skewness.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {metrics.skewness > 0.3
                        ? "Plus de bonnes surprises"
                        : metrics.skewness < -0.3
                        ? "Attention aux mauvaises surprises"
                        : "Distribution équilibrée"}
                    </p>
                  </div>
                )}
              </Section>

              {/* Momentum / RSI */}
              <Section
                icon={<Activity className="w-4 h-4 text-primary" />}
                title="Momentum"
                subtitle="Force et direction du mouvement"
              >
                <RSIIndicator value={metrics.rsi14} signal={metrics.rsiSignal} />
              </Section>

              {/* Qualité des données */}
              <Section
                icon={<Info className="w-4 h-4 text-muted-foreground" />}
                title="Qualité des données"
                subtitle="Fiabilité des analyses"
              >
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Coverage 30j</span>
                      <span className="font-medium">{(metrics.coverage30d * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          metrics.coverage30d >= 0.9 ? "bg-success" : metrics.coverage30d >= 0.6 ? "bg-warning" : "bg-destructive"
                        )}
                        style={{ width: `${metrics.coverage30d * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Fraîcheur des données</span>
                    <span className={cn(
                      "text-sm font-medium",
                      metrics.freshnessDays != null
                        ? metrics.freshnessDays <= 2 ? "text-success" : metrics.freshnessDays <= 7 ? "text-warning" : "text-destructive"
                        : "text-muted-foreground"
                    )}>
                      {metrics.freshnessDays != null ? `${metrics.freshnessDays} jour(s)` : "N/A"}
                    </span>
                  </div>
                </div>
              </Section>

              {/* Fourchette de prix */}
              {(series.minItemPrice != null || series.maxItemPrice != null) && (
                <div className="p-4 rounded-xl bg-muted/30 border">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Fourchette de prix actuelle</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground">
                      {series.minItemPrice?.toFixed(2) ?? "?"} € - {series.maxItemPrice?.toFixed(2) ?? "?"} €
                    </span>
                    {series.retail && (
                      <span className="text-xs text-muted-foreground">
                        Retail: {series.retail.toFixed(2)} €
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TooltipProvider>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================================
// COMPOSANTS INTERNES
// ============================================================================

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-2 pl-6">{children}</div>
    </div>
  );
}

function MetricItem({
  label,
  value,
  variant = "default",
  tooltip,
  showBar,
  barValue,
  barMax = 100,
}: {
  label: string;
  value: string;
  variant?: "default" | "positive" | "negative";
  tooltip?: string;
  showBar?: boolean;
  barValue?: number;
  barMax?: number;
}) {
  const colorClass =
    variant === "positive"
      ? "text-success"
      : variant === "negative"
      ? "text-destructive"
      : "text-foreground";

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground/50 hover:text-muted-foreground">
                <Info className="w-3 h-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showBar && barValue != null && (
          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", variant === "negative" ? "bg-destructive" : "bg-primary")}
              style={{ width: `${Math.min((barValue / barMax) * 100, 100)}%` }}
            />
          </div>
        )}
        <span className={cn("text-sm font-semibold tabular-nums", colorClass)}>{value}</span>
      </div>
    </div>
  );
}

function RatioItem({
  label,
  value,
  thresholds,
}: {
  label: string;
  value: number | null;
  thresholds: { good: number; excellent: number };
}) {
  let quality = "Neutre";
  let colorClass = "text-foreground";

  if (value != null) {
    if (value >= thresholds.excellent) {
      quality = "Excellent";
      colorClass = "text-success";
    } else if (value >= thresholds.good) {
      quality = "Bon";
      colorClass = "text-primary";
    } else if (value < 0) {
      quality = "Faible";
      colorClass = "text-destructive";
    }
  }

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-xs px-1.5 py-0.5 rounded bg-muted", colorClass)}>{quality}</span>
        <span className={cn("text-sm font-semibold tabular-nums", colorClass)}>
          {value != null ? value.toFixed(2) : "N/A"}
        </span>
      </div>
    </div>
  );
}
