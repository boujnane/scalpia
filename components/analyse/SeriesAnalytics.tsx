"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Item } from "@/lib/analyse/types";
import { getBlocImage } from "@/lib/utils";
import { SeriesTrendChart } from "./SeriesTrendChart";
import AdvancedMetricsPanel from "./AdvancedMetricsPanel";
import { detectSeriesSignal } from "@/lib/analyse/signals";

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ArrowUpDown,
  LayoutGrid,
  Table2,
  BarChart3,
  AlertCircle,
  Filter,
  Lock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useSeriesFinance } from "@/hooks/useSeriesFinance";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

/* ═══════════════════════════════════════════════════════════
   Types & Helpers
═══════════════════════════════════════════════════════════ */

type ViewMode = "grid" | "table" | "advanced";
type SortKey = "seriesName" | "premiumNow" | "return7d" | "return30d" | "score";
type MetricPeriod = "return7d" | "return30d";

const formatPercent = (value: number | null): string => {
  if (value == null) return "—";
  const formatted = (value * 100).toFixed(1);
  return value > 0 ? `+${formatted}%` : `${formatted}%`;
};

const TrendBadge = ({ value, size = "default" }: { value: number | null; size?: "sm" | "default" }) => {
  if (value == null) return <span className="text-muted-foreground">—</span>;

  const isUp = value > 0.005;
  const isDown = value < -0.005;
  const colorClass = isUp ? "text-success" : isDown ? "text-destructive" : "text-muted-foreground";
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const iconSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={`flex items-center justify-end gap-1 font-semibold ${colorClass}`}>
      <Icon className={iconSize} />
      <span className={textSize}>{formatPercent(value)}</span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════ */

interface SeriesAnalyticsProps {
  items: Item[];
}

export default function SeriesAnalytics({ items }: SeriesAnalyticsProps) {
  const { isPro } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedBloc, setSelectedBloc] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [metricPeriod, setMetricPeriod] = useState<MetricPeriod>("return7d");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "return7d",
    direction: "desc",
  });
  const [selectedSeries, setSelectedSeries] = useState<SeriesFinanceSummary | null>(null);

  const { blocs, series, kpis } = useSeriesFinance(items, selectedBloc);

  /* ─────────────────────────────────────────────────────────
     Filtered & Sorted Series
  ───────────────────────────────────────────────────────── */
  const filteredSeries = useMemo(() => {
    let result = [...series];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.seriesName.toLowerCase().includes(q));
    }

    const getValue = (s: SeriesFinanceSummary): string | number => {
      switch (sortConfig.key) {
        case "seriesName": return s.seriesName;
        case "premiumNow": return s.metrics.premiumNow ?? -999;
        case "return7d": return s.metrics.return7d ?? -999;
        case "return30d": return s.metrics.return30d ?? -999;
        case "score": return s.metrics.score ?? -999;
        default: return 0;
      }
    };

    result.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (typeof av === "string" && typeof bv === "string") {
        return sortConfig.direction === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortConfig.direction === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

    return result;
  }, [series, searchQuery, sortConfig]);

  const requestSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  };

  /* ─────────────────────────────────────────────────────────
     Color Classes for Grid
  ───────────────────────────────────────────────────────── */
  const getColorClass = (value: number | null): string => {
    if (value == null) return "bg-muted border-border text-foreground";
    if (value > 0.08) return "bg-emerald-600 dark:bg-emerald-500 border-emerald-700 dark:border-emerald-400 text-white";
    if (value > 0.05) return "bg-emerald-500 dark:bg-emerald-600 border-emerald-600 dark:border-emerald-500 text-white";
    if (value > 0.02) return "bg-emerald-400 dark:bg-emerald-700 border-emerald-500 dark:border-emerald-600 text-white";
    if (value > 0) return "bg-emerald-300 dark:bg-emerald-800 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100";
    if (value > -0.02) return "bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100";
    if (value > -0.05) return "bg-rose-300 dark:bg-rose-800 border-rose-400 dark:border-rose-700 text-rose-900 dark:text-rose-100";
    if (value > -0.08) return "bg-rose-400 dark:bg-rose-700 border-rose-500 dark:border-rose-600 text-white";
    return "bg-rose-600 dark:bg-rose-500 border-rose-700 dark:border-rose-400 text-white";
  };

  /* ═══════════════════════════════════════════════════════════
     Render
  ═══════════════════════════════════════════════════════════ */
  return (
    <TooltipProvider>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* ─────────────────────────────────────────────────────────
            HEADER - KPIs + Controls
        ───────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
          {/* Top row: KPIs */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{kpis.totalSeries ?? series.length}</p>
                <p className="text-xs text-muted-foreground">Séries</p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-success">{kpis.up7d ?? 0}</p>
                <p className="text-xs text-muted-foreground">En hausse</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-destructive">{kpis.down7d ?? 0}</p>
                <p className="text-xs text-muted-foreground">En baisse</p>
              </div>
              <div className="w-px h-8 bg-border hidden sm:block" />
              <div className="text-center hidden sm:block">
                <p className="text-2xl font-bold text-primary">{kpis.avgScore?.toFixed(0) ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Score moy.</p>
              </div>
            </div>
          </div>

          {/* Bottom row: Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted order-1 sm:order-none">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Aperçu</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "table" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Données</span>
              </button>
              <button
                onClick={() => setViewMode("advanced")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "advanced" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Avancé</span>
                {!isPro && (
                  <span className="hidden sm:inline-flex items-center gap-0.5 ml-1 px-1 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-semibold">
                    <Sparkles className="w-2 h-2" />
                    PRO
                  </span>
                )}
              </button>
            </div>

            {/* Period toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
              <button
                onClick={() => {
                  setMetricPeriod("return7d");
                  setSortConfig({ key: "return7d", direction: "desc" });
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  metricPeriod === "return7d" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                7 jours
              </button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      if (isPro) {
                        setMetricPeriod("return30d");
                        setSortConfig({ key: "return30d", direction: "desc" });
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      metricPeriod === "return30d"
                        ? "bg-background shadow-sm text-foreground"
                        : isPro
                          ? "text-muted-foreground hover:text-foreground"
                          : "text-muted-foreground/50 cursor-not-allowed"
                    }`}
                  >
                    {!isPro && <Lock className="w-3 h-3" />}
                    30 jours
                    {!isPro && (
                      <span className="inline-flex items-center gap-0.5 ml-1 px-1 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-semibold">
                        <Sparkles className="w-2 h-2" />
                        PRO
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                {!isPro && (
                  <TooltipContent>
                    <p className="text-xs">Connectez-vous pour accéder aux données 30 jours</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une série..."
                className="pl-9 h-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Bloc filter */}
            <Select value={selectedBloc} onValueChange={setSelectedBloc}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 bg-background">
                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Tous les blocs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les blocs</SelectItem>
                {blocs.map((b: string) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────
            VIEW: GRID (Aperçu)
        ───────────────────────────────────────────────────────── */}
        {viewMode === "grid" && (
          <div className="p-4">
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mb-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-2 rounded-full bg-gradient-to-r from-emerald-300 to-emerald-600" />
                <span className="text-muted-foreground">Hausse</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-muted-foreground">Neutre</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-2 rounded-full bg-gradient-to-r from-rose-300 to-rose-600" />
                <span className="text-muted-foreground">Baisse</span>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {filteredSeries.map((s) => {
                const value = s.metrics[metricPeriod];
                const signal = detectSeriesSignal(s);

                return (
                  <Tooltip key={s.seriesName}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setSelectedSeries(s);
                          setViewMode("advanced");
                        }}
                        className={`
                          relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-200
                          hover:scale-[1.02] hover:shadow-md
                          ${getColorClass(value)}
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        `}
                      >
                        {signal.type !== "none" && (() => {
                          const IconComponent = signal.icon;
                          return (
                            <div className="absolute -top-1 -right-1 z-10">
                              <IconComponent className="w-4 h-4" />
                            </div>
                          );
                        })()}

                        <div className="space-y-1.5 text-left">
                          <p className="text-xs sm:text-sm font-bold line-clamp-2 capitalize leading-tight">
                            {s.seriesName}
                          </p>
                          <div className="flex items-center gap-1">
                            {value != null && value > 0.005 && <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                            {value != null && value < -0.005 && <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                            {(value == null || Math.abs(value) <= 0.005) && <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                            <p className="text-sm sm:text-base font-extrabold tabular-nums">
                              {formatPercent(value)}
                            </p>
                          </div>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="space-y-1">
                      <p className="font-semibold capitalize">{s.seriesName}</p>
                      <div className="text-xs space-y-0.5">
                        <p>7j: <span className="font-medium">{formatPercent(s.metrics.return7d)}</span></p>
                        <p>30j: <span className="font-medium">{formatPercent(s.metrics.return30d)}</span></p>
                        <p>Score: <span className="font-medium">{s.metrics.score?.toFixed(0) ?? "—"}/100</span></p>
                      </div>
                      {signal.type !== "none" && (
                        <p className="text-xs pt-1 border-t border-border/50">{signal.description}</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {filteredSeries.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Aucune série trouvée
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            VIEW: TABLE (Données)
        ───────────────────────────────────────────────────────── */}
        {viewMode === "table" && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[200px] cursor-pointer hover:bg-muted/50" onClick={() => requestSort("seriesName")}>
                    <div className="flex items-center">
                      Série
                      {sortConfig.key === "seriesName" && (
                        <ArrowUpDown className="w-3 h-3 ml-1 text-primary" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => requestSort("return7d")}>
                    <div className="flex items-center justify-end">
                      7 jours
                      {sortConfig.key === "return7d" && <ArrowUpDown className="w-3 h-3 ml-1 text-primary" />}
                    </div>
                  </TableHead>
                  {isPro && (
                    <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => requestSort("return30d")}>
                      <div className="flex items-center justify-end">
                        30 jours
                        {sortConfig.key === "return30d" && <ArrowUpDown className="w-3 h-3 ml-1 text-primary" />}
                      </div>
                    </TableHead>
                  )}
                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => requestSort("premiumNow")}>
                    <div className="flex items-center justify-end">
                      Premium
                      {sortConfig.key === "premiumNow" && <ArrowUpDown className="w-3 h-3 ml-1 text-primary" />}
                    </div>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer hover:bg-muted/50" onClick={() => requestSort("score")}>
                    <div className="flex items-center justify-end">
                      Score
                      {sortConfig.key === "score" && <ArrowUpDown className="w-3 h-3 ml-1 text-primary" />}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeries.map((s) => (
                  <TableRow
                    key={s.seriesName}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => {
                      setSelectedSeries(s);
                      setViewMode("advanced");
                    }}
                  >
                    <TableCell className="font-medium capitalize">{s.seriesName}</TableCell>
                    <TableCell className="text-right">
                      <TrendBadge value={s.metrics.return7d} size="sm" />
                    </TableCell>
                    {isPro && (
                      <TableCell className="text-right">
                        <TrendBadge value={s.metrics.return30d} size="sm" />
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <TrendBadge value={s.metrics.premiumNow} size="sm" />
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {s.metrics.score?.toFixed(0) ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredSeries.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                Aucune série trouvée
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            VIEW: ADVANCED (Métriques avancées)
        ───────────────────────────────────────────────────────── */}
        {viewMode === "advanced" && (
          <div className="relative">
            {/* Blur overlay for non-Pro users */}
            {!isPro && (
              <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-8">
                <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                  <Lock className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center max-w-md">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Indicateurs avancés
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Accédez aux ratios de Sharpe, Sortino, RSI, analyse de risque et bien plus avec le plan Pro.
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    Passer en Pro
                  </Link>
                </div>
              </div>
            )}

            <div className={`p-4 space-y-4 ${!isPro ? "blur-[6px] pointer-events-none select-none" : ""}`}>
              {/* Series selector */}
              <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={selectedSeries?.seriesName || ""}
                onValueChange={(value) => {
                  const found = filteredSeries.find((s) => s.seriesName === value);
                  setSelectedSeries(found || null);
                }}
              >
                <SelectTrigger className="w-full sm:w-[350px]">
                  <SelectValue placeholder="Sélectionner une série..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredSeries.map((s) => (
                    <SelectItem key={s.seriesName} value={s.seriesName}>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <span className="capitalize">{s.seriesName}</span>
                        <Badge
                          variant={s.trend7d === "up" ? "success" : s.trend7d === "down" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {formatPercent(s.metrics.return7d)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected series details */}
            {selectedSeries ? (
              <Card className="border-border/50 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="capitalize text-xl">{selectedSeries.seriesName}</CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1">
                        <span>{selectedSeries.itemsCount} produit(s)</span>
                        <span>•</span>
                        <span>{selectedSeries.indexPointsCount} points</span>
                      </CardDescription>
                    </div>
                    <button
                      onClick={() => setSelectedSeries(null)}
                      className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted"
                    >
                      ✕
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <AdvancedMetricsPanel metrics={selectedSeries.metrics} seriesName={selectedSeries.seriesName} />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-border/50 bg-muted/20">
                <CardContent className="py-16 text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Sélectionnez une série</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    pour voir ses indicateurs avancés
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success" />
                    Meilleurs Sharpe Ratio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {filteredSeries
                    .filter((s) => s.metrics.sharpeRatio != null)
                    .sort((a, b) => (b.metrics.sharpeRatio ?? -999) - (a.metrics.sharpeRatio ?? -999))
                    .slice(0, 5)
                    .map((s, idx) => (
                      <button
                        key={s.seriesName}
                        onClick={() => setSelectedSeries(s)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                          <span className="text-sm font-medium capitalize truncate">{s.seriesName}</span>
                        </div>
                        <span className={`text-sm font-bold tabular-nums ${
                          (s.metrics.sharpeRatio ?? 0) > 1 ? "text-success" : "text-foreground"
                        }`}>
                          {s.metrics.sharpeRatio?.toFixed(2) ?? "—"}
                        </span>
                      </button>
                    ))}
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    RSI Survendu (&lt;35)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {filteredSeries
                    .filter((s) => s.metrics.rsi14 != null && s.metrics.rsi14 < 35)
                    .sort((a, b) => (a.metrics.rsi14 ?? 100) - (b.metrics.rsi14 ?? 100))
                    .slice(0, 5)
                    .map((s, idx) => (
                      <button
                        key={s.seriesName}
                        onClick={() => setSelectedSeries(s)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                          <span className="text-sm font-medium capitalize truncate">{s.seriesName}</span>
                        </div>
                        <Badge variant="success" className="font-mono">
                          RSI {s.metrics.rsi14?.toFixed(0)}
                        </Badge>
                      </button>
                    ))}
                  {filteredSeries.filter((s) => s.metrics.rsi14 != null && s.metrics.rsi14 < 35).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucune série en survente</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            FOOTER
        ───────────────────────────────────────────────────────── */}
        <div className="px-4 py-2.5 border-t border-border bg-muted/20 text-center">
          <span className="text-xs text-muted-foreground">
            {filteredSeries.length} série(s) • Données sur {metricPeriod === "return7d" ? "7" : "30"} jours
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
