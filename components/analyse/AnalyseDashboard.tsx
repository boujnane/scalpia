import React, { useState, useMemo } from "react";
import Image from "next/image";
import type { Item } from "@/lib/analyse/types";
import { getBlocImage } from "@/lib/utils";
import { SeriesTrendChart } from "./SeriesTrendChart";

// Icons & UI Components
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  AlertCircle,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ✅ NEW HOOK + types
import { useSeriesFinance } from "@/hooks/useSeriesFinance";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

// --- SUB-COMPONENTS ---

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
    ? "text-emerald-600 dark:text-emerald-500"
    : isDown
    ? "text-rose-600 dark:text-rose-500"
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
}: any) => {
  const colors = {
    default: "text-foreground",
    success: "text-emerald-600 dark:text-emerald-500",
    danger: "text-rose-600 dark:text-rose-500",
    blue: "text-blue-600 dark:text-blue-500",
  };
  const bgColors = {
    default: "bg-muted",
    success: "bg-emerald-500/10",
    danger: "bg-rose-500/10",
    blue: "bg-blue-500/10",
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <div
            className={`text-2xl sm:text-3xl font-bold ${
              colors[variant as keyof typeof colors]
            }`}
          >
            {value}
          </div>
          {subtext && (
            <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
          )}
        </div>
        <div
          className={`p-3 rounded-xl ${bgColors[variant as keyof typeof bgColors]}`}
        >
          <Icon
            className={`w-5 h-5 ${colors[variant as keyof typeof colors]}`}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// --- MAIN COMPONENT ---

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
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  }>({
    key: "premiumNow",
    direction: "desc",
  });

  // ✅ Hook finance (attention aux noms : series, pas data)
  const { blocs, series, kpis } = useSeriesFinance(items, selectedBloc);

  const filteredAndSortedSeries = useMemo(() => {
    let result = [...series];

    if (searchQuery) {
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
        return sortConfig.direction === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
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

  const requestSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey)
      return (
        <ArrowUpDown className="w-3 h-3 text-muted-foreground/30 ml-2" />
      );

    return sortConfig.direction === "asc" ? (
      <TrendingUp className="w-3 h-3 text-primary ml-2 rotate-180" />
    ) : (
      <TrendingDown className="w-3 h-3 text-primary ml-2 rotate-180" />
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center bg-card/50 p-6 rounded-3xl border shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-5">
          {selectedBloc !== "all" && getBlocImage(selectedBloc) ? (
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-sm border bg-white dark:bg-black shrink-0">
              <Image
                src={getBlocImage(selectedBloc)!}
                alt={selectedBloc}
                fill
                className="object-contain p-2"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <LayoutGrid className="w-8 h-8" />
            </div>
          )}

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Analyse Marché
            </h1>
            <p className="text-muted-foreground font-medium text-sm sm:text-base">
              {selectedBloc === "all"
                ? "Vue globale (Finance)"
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

      {/* KPI GRID (je garde ce que ton computeSeriesKPIs renvoie : adapte les champs si besoin) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Séries Analysées"
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
        <TabsList className="bg-muted/50 p-1 w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="overview">
            <span className="sm:hidden">Vue & Graph</span>
            <span className="hidden sm:inline">
              Vue d&apos;ensemble & Graphique
            </span>
          </TabsTrigger>
          <TabsTrigger value="data">
            <span className="sm:hidden">Données</span>
            <span className="hidden sm:inline">Données Détaillées</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1 */}
        <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-2">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle>Tendances comparatives</CardTitle>
              <CardDescription>
                Écart relatif au prix retail · retours 7j / 30j · score d’attractivité
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <SeriesTrendChart data={filteredAndSortedSeries} />
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm flex flex-col h-full max-h-[800px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Plus forte surcote
              </CardTitle>
              <CardDescription>
                Écart relatif actuel le plus élevé (vs prix retail)
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto pr-2 space-y-1">

                {filteredAndSortedSeries
                  .filter((s) => (s.metrics.premiumNow ?? 0) > 0)
                  .sort(
                    (a, b) =>
                      (b.metrics.premiumNow ?? -999) -
                      (a.metrics.premiumNow ?? -999)
                  )
                  .slice(0, 15)
                  .map((s, idx) => (
                    <div
                      key={s.seriesName}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-border/50"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="font-mono text-xs text-muted-foreground w-4 text-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="font-medium text-sm truncate capitalize group-hover:text-primary transition-colors">
                          {s.seriesName}
                        </div>
                      </div>
                      <TrendBadge value={s.metrics.premiumNow} trend={s.trend7d} />
                    </div>
                  ))}

                {filteredAndSortedSeries.filter((s) => (s.metrics.premiumNow ?? 0) > 0).length === 0 && (
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
          <Card className="border-border/50 shadow-sm overflow-hidden">
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
                      Écart relatif (au prix retail) <SortIcon columnKey="premiumNow" />
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
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {lowCoverage ? "Coverage 30j faible" : "Donnée ancienne"}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
                                style={{
                                  width: `${Math.min((s.metrics.coverage30d ?? 0) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {((s.metrics.coverage30d ?? 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="text-xs text-muted-foreground">
                            {s.metrics.freshnessDays == null ? "-" : `${s.metrics.freshnessDays}j`}
                          </span>
                        </TableCell>

                        <TableCell className="text-right font-semibold">
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
      </Tabs>
    </div>
  );
}
