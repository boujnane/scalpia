import React, { useMemo, useState } from "react";
import Image from "next/image";
import type { Item } from "@/lib/analyse/types";
import { getBlocImage } from "@/lib/utils";
import { SeriesTrendChart } from "./SeriesTrendChart";
import AdvancedMetricsPanel from "./AdvancedMetricsPanel";

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  AlertCircle,
  ChevronRight,
  BarChart3,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { useSeriesFinance } from "@/hooks/useSeriesFinance";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

const TrendBadge = ({
  trend,
  value,
  suffix = "",
}: {
  trend?: "up" | "down" | "stable" | "na";
  value?: number | null;
  suffix?: string;
}) => {
  if (value == null) return <span className="text-muted-foreground">-</span>;

  const isUp = trend === "up" || (trend == null && value > 0);
  const isDown = trend === "down" || (trend == null && value < 0);

  const colorClass = isUp
    ? "text-success"
    : isDown
    ? "text-destructive"
    : "text-muted-foreground";

  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <div className={`flex items-center gap-1.5 font-bold ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>
        {value > 0 ? "+" : ""}
        {(value * 100).toFixed(2)}%{suffix}
      </span>
    </div>
  );
};

const KpiCard = ({
  title,
  value,
  icon: Icon,
  subtext,
  variant = "default",
}: {
  title: string;
  value: React.ReactNode;
  icon: any;
  subtext?: string;
  variant?: "default" | "success" | "danger" | "blue";
}) => {
  const colors = {
    default: "text-foreground",
    success: "text-success",
    danger: "text-destructive",
    blue: "text-primary",
  };

  const bgColors = {
    default: "bg-muted",
    success: "bg-success/10",
    danger: "bg-destructive/10",
    blue: "bg-primary/10",
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <div className={`text-2xl sm:text-3xl font-bold ${colors[variant]}`}>{value}</div>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>

        <div className={`p-3 rounded-xl ${bgColors[variant]} shrink-0`}>
          <Icon className={`w-5 h-5 ${colors[variant]}`} />
        </div>
      </CardContent>
    </Card>
  );
};

interface AnalyseDashboardProps {
  items: Item[];
}

type SortKey =
  | "seriesName"
  | "premiumNow"
  | "return7d"
  | "return30d"
  | "coverage30d"
  | "freshnessDays"
  | "score"
  | "indexPointsCount";

export default function AnalyseDashboard({ items }: AnalyseDashboardProps) {
  const [selectedBloc, setSelectedBloc] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "premiumNow",
    direction: "desc",
  });
  const [selectedSeries, setSelectedSeries] = useState<SeriesFinanceSummary | null>(null);

  const { blocs, series, kpis } = useSeriesFinance(items, selectedBloc);

  const filteredAndSortedSeries = useMemo(() => {
    let result = [...series];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.seriesName.toLowerCase().includes(q));
    }

    const getValue = (s: SeriesFinanceSummary): string | number => {
      switch (sortConfig.key) {
        case "seriesName":
          return s.seriesName;
        case "premiumNow":
          return s.metrics.premiumNow ?? -999;
        case "return7d":
          return s.metrics.return7d ?? -999;
        case "return30d":
          return s.metrics.return30d ?? -999;
        case "coverage30d":
          return s.metrics.coverage30d ?? 0;
        case "freshnessDays":
          return s.metrics.freshnessDays ?? 9999;
        case "score":
          return s.metrics.score ?? -999;
        case "indexPointsCount":
          return s.indexPointsCount ?? 0;
        default:
          return 0;
      }
    };

    result.sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);

      if (typeof av === "string" && typeof bv === "string") {
        return sortConfig.direction === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }

      const an = Number(av);
      const bn = Number(bv);

      if (Number.isNaN(an) && Number.isNaN(bn)) return 0;
      if (Number.isNaN(an)) return 1;
      if (Number.isNaN(bn)) return -1;

      return sortConfig.direction === "asc" ? an - bn : bn - an;
    });

    return result;
  }, [series, searchQuery, sortConfig]);

  const topPremiumSeries = useMemo(() => {
    return filteredAndSortedSeries
      .filter((s) => (s.metrics.premiumNow ?? 0) > 0)
      .sort((a, b) => (b.metrics.premiumNow ?? -999) - (a.metrics.premiumNow ?? -999))
      .slice(0, 15);
  }, [filteredAndSortedSeries]);

  const requestSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 text-muted-foreground/40 ml-2" />;
    }
    return sortConfig.direction === "asc" ? (
      <TrendingUp className="w-3 h-3 text-primary ml-2 rotate-180" />
    ) : (
      <TrendingDown className="w-3 h-3 text-primary ml-2 rotate-180" />
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-card/50 p-4 sm:p-6 rounded-2xl border border-border/60 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {selectedBloc !== "all" && getBlocImage(selectedBloc) ? (
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border bg-card shrink-0">
                <Image
                  src={getBlocImage(selectedBloc)!}
                  alt={selectedBloc}
                  fill
                  className="object-contain p-2"
                />
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <LayoutGrid className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            )}

            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Analyse Marché
              </h2>
              <p className="text-muted-foreground font-medium text-sm sm:text-base truncate">
                {selectedBloc === "all"
                  ? "Vue globale (indicateurs financiers)"
                  : `Focus : Bloc ${selectedBloc}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrer les séries..."
                className="pl-9 bg-background/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedBloc} onValueChange={setSelectedBloc}>
              <SelectTrigger className="w-full sm:w-[220px] bg-background/50">
                <SelectValue placeholder="Choisir un bloc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="font-semibold">Tous les blocs</span>
                </SelectItem>
                {blocs.map((b: string) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Séries analysées"
            value={kpis.totalSeries ?? series.length}
            icon={List}
            variant="blue"
            subtext="Séries"
          />
          <KpiCard
            title="Score moyen"
            value={kpis.avgScore == null ? "-" : kpis.avgScore.toFixed(1)}
            icon={TrendingUp}
            variant={kpis.avgScore != null && kpis.avgScore >= 50 ? "success" : "default"}
            subtext="Composite"
          />
          <KpiCard
            title="Hausse (7j)"
            value={kpis.up7d ?? "-"}
            icon={TrendingUp}
            variant="success"
            subtext="Return 7j"
          />
          <KpiCard
            title="Baisse (7j)"
            value={kpis.down7d ?? "-"}
            icon={TrendingDown}
            variant="danger"
            subtext="Return 7j"
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 w-full sm:w-auto grid grid-cols-3 sm:inline-flex rounded-xl">
            <TabsTrigger value="overview">
              <span className="sm:hidden">Vue</span>
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="data">
              <span className="sm:hidden">Données</span>
              <span className="hidden sm:inline">Données détaillées</span>
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <BarChart3 className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
              <span className="sm:hidden">Avancé</span>
              <span className="hidden sm:inline">Indicateurs avancés</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1 */}
          <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>Tendances comparatives</CardTitle>
                  <CardDescription>
                    Écart relatif retail · retours 7j/30j · score
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6">
                  <SeriesTrendChart data={filteredAndSortedSeries} />
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm flex flex-col max-h-[760px]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-success" />
                    Plus forte surcote
                  </CardTitle>
                  <CardDescription>Écart relatif actuel le plus élevé (vs retail)</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto pr-2 space-y-1">
                  {topPremiumSeries.map((s, idx) => (
                    <button
                      key={s.seriesName}
                      type="button"
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-border/50 text-left"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="font-mono text-xs text-muted-foreground w-5 text-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="font-medium text-sm truncate capitalize group-hover:text-primary transition-colors">
                          {s.seriesName}
                        </div>
                      </div>
                      <TrendBadge value={s.metrics.premiumNow} trend={s.trend7d} />
                    </button>
                  ))}

                  {topPremiumSeries.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Aucune donnée positive trouvée
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2 */}
          <TabsContent value="data" className="animate-in slide-in-from-bottom-2">
            {/* Mobile: cards list */}
            <div className="space-y-3 md:hidden">
              {filteredAndSortedSeries.map((s) => {
                const lowCoverage = (s.metrics.coverage30d ?? 0) < 0.6;
                const stale = (s.metrics.freshnessDays ?? 999) > 7;

                return (
                  <Card key={s.seriesName} className="border-border/50 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {(lowCoverage || stale) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex">
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {lowCoverage ? "Coverage 30j faible" : "Donnée ancienne"}
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <p className="font-semibold capitalize truncate">{s.seriesName}</p>
                          </div>

                          <p className="text-xs text-muted-foreground mt-0.5">
                            Points index : <span className="tabular-nums">{s.indexPointsCount}</span>
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">Score</p>
                          <p className="font-bold tabular-nums">{s.metrics.score ?? "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Premium</p>
                          <TrendBadge value={s.metrics.premiumNow} trend={s.trend7d} />
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Retour 7j</p>
                          {s.metrics.return7d != null ? (
                            <Badge
                              variant={
                                s.trend7d === "up"
                                  ? "success"
                                  : s.trend7d === "down"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="font-normal"
                            >
                              {(s.metrics.return7d * 100).toFixed(1)}%
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">-</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">Coverage</p>
                          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full ${(s.metrics.coverage30d ?? 0) >= 0.9 ? "bg-primary" : "bg-yellow-500"}`}
                              style={{ width: `${Math.min((s.metrics.coverage30d ?? 0) * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {((s.metrics.coverage30d ?? 0) * 100).toFixed(0)}%
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Freshness :{" "}
                          <span className="tabular-nums">
                            {s.metrics.freshnessDays == null ? "-" : `${s.metrics.freshnessDays}j`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredAndSortedSeries.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Aucune série trouvée pour "{searchQuery}"
                </div>
              )}
            </div>

            {/* Desktop: table */}
            <Card className="border-border/50 shadow-sm overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead
                        className="w-[320px] cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => requestSort("seriesName")}
                      >
                        <div className="flex items-center">
                          Série <SortIcon columnKey="seriesName" />
                        </div>
                      </TableHead>

                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                        onClick={() => requestSort("premiumNow")}
                      >
                        <div className="flex items-center justify-end">
                          Écart relatif <SortIcon columnKey="premiumNow" />
                        </div>
                      </TableHead>

                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-center"
                        onClick={() => requestSort("return7d")}
                      >
                        <div className="flex items-center justify-center">
                          Retour 7j <SortIcon columnKey="return7d" />
                        </div>
                      </TableHead>

                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-center"
                        onClick={() => requestSort("coverage30d")}
                      >
                        <div className="flex items-center justify-center">
                          Coverage 30j <SortIcon columnKey="coverage30d" />
                        </div>
                      </TableHead>

                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-center"
                        onClick={() => requestSort("freshnessDays")}
                      >
                        <div className="flex items-center justify-center">
                          Freshness <SortIcon columnKey="freshnessDays" />
                        </div>
                      </TableHead>

                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                        onClick={() => requestSort("score")}
                      >
                        <div className="flex items-center justify-end">
                          Score <SortIcon columnKey="score" />
                        </div>
                      </TableHead>

                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                        onClick={() => requestSort("indexPointsCount")}
                      >
                        <div className="flex items-center justify-end">
                          Points <SortIcon columnKey="indexPointsCount" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredAndSortedSeries.map((s) => {
                      const lowCoverage = (s.metrics.coverage30d ?? 0) < 0.6;
                      const stale = (s.metrics.freshnessDays ?? 999) > 7;

                      return (
                        <TableRow key={s.seriesName} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-medium capitalize">
                            <div className="flex items-center gap-2">
                              {(lowCoverage || stale) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex">
                                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {lowCoverage ? "Coverage 30j faible" : "Donnée ancienne"}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {s.seriesName}
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end">
                              <TrendBadge value={s.metrics.premiumNow} trend={s.trend7d} />
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            {s.metrics.return7d != null ? (
                              <Badge
                                variant={
                                  s.trend7d === "up"
                                    ? "success"
                                    : s.trend7d === "down"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="font-normal"
                              >
                                {(s.metrics.return7d * 100).toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">-</span>
                            )}
                          </TableCell>

                          <TableCell className="text-center">
                            <div className="inline-flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${(s.metrics.coverage30d ?? 0) >= 0.9 ? "bg-primary" : "bg-yellow-500"}`}
                                  style={{ width: `${Math.min((s.metrics.coverage30d ?? 0) * 100, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
                                {((s.metrics.coverage30d ?? 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="text-center">
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {s.metrics.freshnessDays == null ? "-" : `${s.metrics.freshnessDays}j`}
                            </span>
                          </TableCell>

                          <TableCell className="text-right font-semibold tabular-nums">
                            {s.metrics.score == null ? "-" : s.metrics.score.toFixed(0)}
                          </TableCell>

                          <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                            {s.indexPointsCount}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {filteredAndSortedSeries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Aucune série trouvée pour "{searchQuery}"
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 3: INDICATEURS AVANCÉS */}
          <TabsContent value="advanced" className="animate-in slide-in-from-bottom-2">
            <div className="space-y-6">
              {/* Sélecteur de série */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Analyse détaillée par série
                  </CardTitle>
                  <CardDescription>
                    Sélectionnez une série pour voir ses indicateurs financiers avancés
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedSeries?.seriesName || ""}
                    onValueChange={(value) => {
                      const found = filteredAndSortedSeries.find((s) => s.seriesName === value);
                      setSelectedSeries(found || null);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[400px]">
                      <SelectValue placeholder="Choisir une série à analyser..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAndSortedSeries.map((s) => (
                        <SelectItem key={s.seriesName} value={s.seriesName}>
                          <div className="flex items-center justify-between gap-4 w-full">
                            <span className="capitalize">{s.seriesName}</span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  s.trend7d === "up"
                                    ? "success"
                                    : s.trend7d === "down"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-[10px]"
                              >
                                {s.metrics.return7d != null
                                  ? `${s.metrics.return7d > 0 ? "+" : ""}${(s.metrics.return7d * 100).toFixed(1)}%`
                                  : "-"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Score: {s.metrics.score ?? "-"}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Panneau de métriques avancées */}
              {selectedSeries ? (
                <Card className="border-border/50 shadow-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="capitalize text-xl">
                          {selectedSeries.seriesName}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-3 mt-1">
                          <span>{selectedSeries.itemsCount} produit(s)</span>
                          <span>•</span>
                          <span>{selectedSeries.indexPointsCount} points de données</span>
                          {selectedSeries.lastDate && (
                            <>
                              <span>•</span>
                              <span>
                                Dernière MAJ:{" "}
                                {new Date(selectedSeries.lastDate).toLocaleDateString("fr-FR")}
                              </span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <button
                        onClick={() => setSelectedSeries(null)}
                        className="text-muted-foreground hover:text-foreground transition p-2 rounded-lg hover:bg-muted"
                      >
                        <ChevronRight className="w-5 h-5 rotate-90" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <AdvancedMetricsPanel
                      metrics={selectedSeries.metrics}
                      seriesName={selectedSeries.seriesName}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-2 border-border/50 bg-muted/20">
                  <CardContent className="py-16 text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">
                      Sélectionnez une série ci-dessus
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      pour afficher ses indicateurs financiers avancés
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Top séries par indicateur */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-success" />
                      Meilleurs Sharpe Ratio
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Meilleures performances ajustées au risque
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {filteredAndSortedSeries
                      .filter((s) => s.metrics.sharpeRatio != null)
                      .sort((a, b) => (b.metrics.sharpeRatio ?? -999) - (a.metrics.sharpeRatio ?? -999))
                      .slice(0, 5)
                      .map((s, idx) => (
                        <button
                          key={s.seriesName}
                          onClick={() => setSelectedSeries(s)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                            <span className="text-sm font-medium capitalize truncate">
                              {s.seriesName}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-bold tabular-nums ${
                              (s.metrics.sharpeRatio ?? 0) > 1
                                ? "text-success"
                                : (s.metrics.sharpeRatio ?? 0) > 0
                                ? "text-foreground"
                                : "text-destructive"
                            }`}
                          >
                            {s.metrics.sharpeRatio?.toFixed(2) ?? "-"}
                          </span>
                        </button>
                      ))}
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-primary" />
                      RSI Survendu (opportunités)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Séries avec RSI &lt; 35 - potentiel rebond
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {filteredAndSortedSeries
                      .filter((s) => s.metrics.rsi14 != null && s.metrics.rsi14 < 35)
                      .sort((a, b) => (a.metrics.rsi14 ?? 100) - (b.metrics.rsi14 ?? 100))
                      .slice(0, 5)
                      .map((s, idx) => (
                        <button
                          key={s.seriesName}
                          onClick={() => setSelectedSeries(s)}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                            <span className="text-sm font-medium capitalize truncate">
                              {s.seriesName}
                            </span>
                          </div>
                          <Badge
                            variant="success"
                            className="font-mono"
                          >
                            RSI {s.metrics.rsi14?.toFixed(0) ?? "-"}
                          </Badge>
                        </button>
                      ))}
                    {filteredAndSortedSeries.filter(
                      (s) => s.metrics.rsi14 != null && s.metrics.rsi14 < 35
                    ).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune série en zone de survente actuellement
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
