"use client";

import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  Filter,
  ChevronRight,
  Target,
  Activity,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";
import SeriesDetailSheet from "./SeriesDetailSheet";

// ============================================================================
// TYPES
// ============================================================================

type SortField = "name" | "score" | "return7d" | "return30d" | "vol30d" | "rsi" | "premium";
type SortDir = "asc" | "desc";
type QuickFilter = "all" | "trending_up" | "trending_down" | "oversold" | "overbought" | "high_score" | "low_vol";

interface SeriesExplorerProps {
  series: SeriesFinanceSummary[];
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const QUICK_FILTERS: { id: QuickFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "all", label: "Toutes", icon: null, color: "bg-muted" },
  { id: "trending_up", label: "Hausse", icon: <TrendingUp className="w-3 h-3" />, color: "bg-success/20 text-success" },
  { id: "trending_down", label: "Baisse", icon: <TrendingDown className="w-3 h-3" />, color: "bg-destructive/20 text-destructive" },
  { id: "oversold", label: "RSI Survendu", icon: <Activity className="w-3 h-3" />, color: "bg-success/20 text-success" },
  { id: "overbought", label: "RSI Suracheté", icon: <Activity className="w-3 h-3" />, color: "bg-warning/20 text-warning" },
  { id: "high_score", label: "Score 70+", icon: <Target className="w-3 h-3" />, color: "bg-primary/20 text-primary" },
  { id: "low_vol", label: "Faible volatilité", icon: <Shield className="w-3 h-3" />, color: "bg-primary/20 text-primary" },
];

function applyQuickFilter(series: SeriesFinanceSummary[], filter: QuickFilter): SeriesFinanceSummary[] {
  switch (filter) {
    case "trending_up":
      return series.filter(s => s.trend7d === "up");
    case "trending_down":
      return series.filter(s => s.trend7d === "down");
    case "oversold":
      return series.filter(s => s.metrics.rsiSignal === "oversold");
    case "overbought":
      return series.filter(s => s.metrics.rsiSignal === "overbought");
    case "high_score":
      return series.filter(s => s.metrics.score != null && s.metrics.score >= 70);
    case "low_vol":
      return series.filter(s => s.metrics.vol30d != null && s.metrics.vol30d < 0.03);
    default:
      return series;
  }
}

function sortSeries(series: SeriesFinanceSummary[], field: SortField, dir: SortDir): SeriesFinanceSummary[] {
  const sorted = [...series].sort((a, b) => {
    let valA: number | null = null;
    let valB: number | null = null;

    switch (field) {
      case "name":
        return dir === "asc"
          ? a.seriesName.localeCompare(b.seriesName)
          : b.seriesName.localeCompare(a.seriesName);
      case "score":
        valA = a.metrics.score;
        valB = b.metrics.score;
        break;
      case "return7d":
        valA = a.metrics.return7d;
        valB = b.metrics.return7d;
        break;
      case "return30d":
        valA = a.metrics.return30d;
        valB = b.metrics.return30d;
        break;
      case "vol30d":
        valA = a.metrics.vol30d;
        valB = b.metrics.vol30d;
        break;
      case "rsi":
        valA = a.metrics.rsi14;
        valB = b.metrics.rsi14;
        break;
      case "premium":
        valA = a.metrics.premiumNow;
        valB = b.metrics.premiumNow;
        break;
    }

    // Handle nulls
    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;

    return dir === "asc" ? valA - valB : valB - valA;
  });

  return sorted;
}

function formatPercent(value: number | null): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(1)}%`;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function SeriesExplorer({ series, className }: SeriesExplorerProps) {
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sortField, setSortField] = useState<SortField>("score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedSeries, setSelectedSeries] = useState<SeriesFinanceSummary | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filteredSeries = useMemo(() => {
    let result = series;

    // Recherche texte
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s => s.seriesName.toLowerCase().includes(q));
    }

    // Quick filter
    result = applyQuickFilter(result, quickFilter);

    // Tri
    result = sortSeries(result, sortField, sortDir);

    return result;
  }, [series, search, quickFilter, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleSeriesClick = (s: SeriesFinanceSummary) => {
    setSelectedSeries(s);
    setSheetOpen(true);
  };

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

  const getScoreColor = (score: number | null) => {
    if (score == null) return "text-muted-foreground";
    if (score >= 70) return "text-success";
    if (score >= 50) return "text-primary";
    if (score >= 30) return "text-warning";
    return "text-destructive";
  };

  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une série..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setQuickFilter(f.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                quickFilter === f.id
                  ? f.color + " ring-2 ring-offset-2 ring-primary/50"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Tri */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Trier par :</span>
          {[
            { field: "score" as SortField, label: "Score" },
            { field: "return7d" as SortField, label: "7j" },
            { field: "return30d" as SortField, label: "30j" },
            { field: "vol30d" as SortField, label: "Vol." },
            { field: "rsi" as SortField, label: "RSI" },
            { field: "premium" as SortField, label: "Surcote" },
          ].map(({ field, label }) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              className={cn(
                "px-2 py-1 rounded transition-colors",
                sortField === field
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted"
              )}
            >
              {label}
              {sortField === field && (
                <span className="ml-0.5">{sortDir === "desc" ? "↓" : "↑"}</span>
              )}
            </button>
          ))}
        </div>

        {/* Compteur */}
        <div className="text-sm text-muted-foreground">
          {filteredSeries.length} série{filteredSeries.length > 1 ? "s" : ""} trouvée{filteredSeries.length > 1 ? "s" : ""}
        </div>

        {/* Liste des séries */}
        <ScrollArea className="h-[500px] rounded-lg border">
          <div className="divide-y">
            {filteredSeries.map(s => (
              <button
                key={s.seriesName}
                onClick={() => handleSeriesClick(s)}
                className="w-full p-4 text-left hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Info principale */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground capitalize truncate">
                        {s.seriesName}
                      </span>
                      {getTrendIcon(s.trend7d)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{s.itemsCount} produit{s.itemsCount > 1 ? "s" : ""}</span>
                      {s.metrics.rsiSignal && s.metrics.rsiSignal !== "neutral" && (
                        <Badge
                          variant={s.metrics.rsiSignal === "oversold" ? "success" : "warning"}
                          className="text-[10px] px-1.5"
                        >
                          {s.metrics.rsiSignal === "oversold" ? "Survendu" : "Suracheté"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Métriques rapides */}
                  <div className="flex items-center gap-4 text-sm">
                    {/* Score */}
                    <div className="text-center min-w-[50px]">
                      <div className={cn("font-bold tabular-nums", getScoreColor(s.metrics.score))}>
                        {s.metrics.score ?? "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Score</div>
                    </div>

                    {/* Variation 7j */}
                    <div className="text-center min-w-[60px] hidden sm:block">
                      <div
                        className={cn(
                          "font-semibold tabular-nums",
                          s.metrics.return7d != null
                            ? s.metrics.return7d > 0
                              ? "text-success"
                              : s.metrics.return7d < 0
                              ? "text-destructive"
                              : "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {formatPercent(s.metrics.return7d)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">7 jours</div>
                    </div>

                    {/* RSI */}
                    <div className="text-center min-w-[40px] hidden md:block">
                      <div
                        className={cn(
                          "font-semibold tabular-nums",
                          s.metrics.rsi14 != null
                            ? s.metrics.rsi14 < 35
                              ? "text-success"
                              : s.metrics.rsi14 > 65
                              ? "text-warning"
                              : "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {s.metrics.rsi14?.toFixed(0) ?? "—"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">RSI</div>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </button>
            ))}

            {filteredSeries.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucune série ne correspond aux filtres</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Sheet de détail */}
      <SeriesDetailSheet
        series={selectedSeries}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
}
