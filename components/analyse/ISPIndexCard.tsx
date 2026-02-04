"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  LineChart as LineChartIcon,
  Activity,
  Calendar,
  Flame,
  AlertTriangle,
  CheckCircle,
  Gem,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import type { Item } from "@/lib/analyse/types";
import { computeISPFromItems, ISPIndexSummary, debugVariationBetweenDates } from "@/lib/analyse/finance/ispIndex";
import { ChevronDown, ChevronUp, Bug } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/context/AuthContext";

interface ISPIndexCardProps {
  items: Item[];
}

const formatPercent = (value: number | null, withSign: boolean = true): string => {
  if (value == null) return "N/A";
  const formatted = (value * 100).toFixed(2);
  return withSign && value > 0 ? `+${formatted}%` : `${formatted}%`;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const TrendBadge = ({ value, label }: { value: number | null; label: string }) => {
  if (value == null) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
        <Minus className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
        <div className="text-left flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
          <p className="font-semibold text-xs sm:text-sm">N/A</p>
        </div>
      </div>
    );
  }

  const isPositive = value > 0;
  const isNeutral = Math.abs(value) < 0.005;

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const colorClass = isNeutral
    ? "text-muted-foreground"
    : isPositive
    ? "text-success"
    : "text-destructive";
  const bgClass = isNeutral
    ? "bg-muted"
    : isPositive
    ? "bg-success/10"
    : "bg-destructive/10";

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 ${colorClass}`}>
      <div className={`p-1.5 sm:p-2 rounded-lg ${bgClass} shrink-0`}>
        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-sm sm:text-base md:text-lg tabular-nums">{formatPercent(value)}</p>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;
  const dailyChangePercent = (data.dailyChange * 100).toFixed(2);
  const dailyChangeSign = data.dailyChange >= 0 ? "+" : "";

  return (
    <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-xl p-3 space-y-1">
      <p className="text-sm font-semibold text-foreground">{formatDate(data.date)}</p>
      <p className="text-lg font-bold text-primary">{data.value.toFixed(2)}</p>
      <p className="text-xs text-muted-foreground">
        {dailyChangeSign}{dailyChangePercent}% ({data.itemCount} items)
      </p>
    </div>
  );
};

export default function ISPIndexCard({ items }: ISPIndexCardProps) {
  const [timeframe, setTimeframe] = useState<"30d" | "90d" | "1y" | "all">("90d");
  const [debugOpen, setDebugOpen] = useState(false);
  const { isAdmin } = useAuth();

  const ispSummary: ISPIndexSummary = useMemo(() => {
    return computeISPFromItems(items);
  }, [items]);

  // Debug: trouver les items responsables de la variation du jour
  const debugData = useMemo(() => {
    if (ispSummary.history.length < 2) return null;

    const sorted = [...ispSummary.history].sort((a, b) => a.date.localeCompare(b.date));
    const lastPoint = sorted[sorted.length - 1];
    const prevPoint = sorted[sorted.length - 2];

    if (!lastPoint || !prevPoint) return null;

    const itemsWithName = items.map(item => ({
      name: item.name || "Unknown",
      prices: item.prices,
      retailPrice: item.retailPrice,
    }));

    const variations = debugVariationBetweenDates(itemsWithName, prevPoint.date, lastPoint.date);

    return {
      dateAfter: lastPoint.date,
      dateBefore: prevPoint.date,
      indexBefore: prevPoint.value,
      indexAfter: lastPoint.value,
      dailyChange: lastPoint.dailyChange,
      itemCount: lastPoint.itemCount,
      variations,
    };
  }, [items, ispSummary.history]);

  const chartData = useMemo(() => {
    const now = new Date();
    let daysBack: number;

    switch (timeframe) {
      case "30d":
        daysBack = 30;
        break;
      case "90d":
        daysBack = 90;
        break;
      case "1y":
        daysBack = 365;
        break;
      default:
        return ispSummary.history;
    }

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return ispSummary.history.filter((p) => new Date(p.date) >= cutoffDate);
  }, [ispSummary.history, timeframe]);

  const trendIcon =
    ispSummary.trend === "up" ? TrendingUp : ispSummary.trend === "down" ? TrendingDown : Minus;
  const trendColor =
    ispSummary.trend === "up"
      ? "text-success"
      : ispSummary.trend === "down"
      ? "text-destructive"
      : "text-muted-foreground";
  const trendBg =
    ispSummary.trend === "up"
      ? "bg-success/10"
      : ispSummary.trend === "down"
      ? "bg-destructive/10"
      : "bg-muted";

  const marketStatus = useMemo(() => {
    const change7d = ispSummary.change7d ?? 0;
    const change30d = ispSummary.change30d ?? 0;

    // Statut basé sur la dynamique récente (momentum), pas la valorisation vs retail
    // Le marché scellé Pokémon est structurellement haussier, le retail n'est qu'un point d'entrée initial
    if (change7d > 0.05) return { icon: Flame, text: "Forte accélération haussière", color: "text-emerald-600 dark:text-emerald-400" };
    if (change7d > 0.02) return { icon: TrendingUp, text: "Marché en hausse", color: "text-emerald-600 dark:text-emerald-400" };
    if (change7d < -0.05) return { icon: AlertTriangle, text: "Correction marquée", color: "text-red-600 dark:text-red-400" };
    if (change7d < -0.02) return { icon: TrendingDown, text: "Marché en repli", color: "text-orange-600 dark:text-orange-400" };

    // Tendance neutre sur 7j, on regarde le 30j pour plus de contexte
    if (change30d > 0.05) return { icon: CheckCircle, text: "Consolidation après hausse", color: "text-blue-600 dark:text-blue-400" };
    if (change30d < -0.05) return { icon: Gem, text: "Stabilisation après correction", color: "text-purple-600 dark:text-purple-400" };

    return { icon: Minus, text: "Marché stable", color: "text-muted-foreground" };
  }, [ispSummary.change7d, ispSummary.change30d]);

  const TrendIcon = trendIcon;

  return (
    <TooltipProvider>
      <Card className="border-primary/20 shadow-xl overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
        <CardHeader className="pb-3 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                <CardTitle className="text-lg sm:text-xl md:text-2xl">ISP-FR</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition shrink-0">
                      <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-popover text-popover-foreground">
                    <p className="font-semibold mb-1 text-foreground">Index du Scellé Pokémon FR</p>
                    <p className="text-xs text-muted-foreground">
                      Mesure l'<span className="font-semibold text-foreground">évolution globale</span> du marché français des produits scellés Pokémon.
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Index chaîné basé sur les variations quotidiennes. Base 100 au démarrage.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardDescription className="text-xs sm:text-sm">Index du Scellé Pokémon FR</CardDescription>
            </div>

            <div className={`p-2 sm:p-3 rounded-xl ${trendBg} shrink-0`}>
              <TrendIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${trendColor}`} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          {/* Valeur actuelle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Valeur actuelle</p>
              <p className="text-4xl sm:text-5xl font-extrabold text-primary tabular-nums">{ispSummary.current.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Base 100 = Valeur initiale
              </p>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <Badge
                variant={
                  ispSummary.trend === "up"
                    ? "success"
                    : ispSummary.trend === "down"
                    ? "destructive"
                    : "secondary"
                }
                className="text-xs sm:text-sm font-semibold"
              >
                {formatPercent(ispSummary.change7d)} (7j)
              </Badge>
              {ispSummary.lastUpdate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(ispSummary.lastUpdate)}
                </p>
              )}
            </div>
          </div>

          {/* Status du marché */}
          <div className="p-3 sm:p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center justify-center gap-2">
              <marketStatus.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${marketStatus.color}`} />
              <p className={`text-xs sm:text-sm font-medium ${marketStatus.color}`}>{marketStatus.text}</p>
            </div>
          </div>

          {/* Variations */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <TrendBadge value={ispSummary.change7d} label="7 jours" />
            <TrendBadge value={ispSummary.change30d} label="30 jours" />
            <TrendBadge value={ispSummary.change90d} label="90 jours" />
            <TrendBadge value={ispSummary.changeYTD} label="YTD" />
          </div>

          {/* Graphique */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LineChartIcon className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Évolution historique</h3>
              </div>

              <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)} className="w-auto">
                <TabsList className="h-8 p-1 bg-muted/50">
                  <TabsTrigger value="30d" className="text-xs px-2 py-1">
                    30J
                  </TabsTrigger>
                  <TabsTrigger value="90d" className="text-xs px-2 py-1">
                    90J
                  </TabsTrigger>
                  <TabsTrigger value="1y" className="text-xs px-2 py-1">
                    1A
                  </TabsTrigger>
                  <TabsTrigger value="all" className="text-xs px-2 py-1">
                    Max
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="w-full h-[280px] sm:h-[320px] text-muted-foreground">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIndex" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(59, 130, 246)" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    opacity={0.2}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => {
                      const d = new Date(date);
                      return d.toLocaleDateString("fr-FR", { month: "short", day: "numeric" });
                    }}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    stroke="currentColor"
                    strokeOpacity={0.3}
                    tickLine={{ stroke: "currentColor", strokeOpacity: 0.3 }}
                  />
                  <YAxis
                    domain={["dataMin - 5", "dataMax + 5"]}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    stroke="currentColor"
                    strokeOpacity={0.3}
                    tickLine={{ stroke: "currentColor", strokeOpacity: 0.3 }}
                    tickFormatter={(v) => v.toFixed(0)}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  {/* Annotation: Ajout Leboncoin le 30 novembre 2025 */}
                  <ReferenceLine
                    x="2025-11-30"
                    stroke="#f97316"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: "Ajout Leboncoin",
                      position: "top",
                      fill: "#f97316",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth={4}
                    fill="url(#colorIndex)"
                    dot={false}
                    activeDot={{ r: 7, fill: "rgb(59, 130, 246)", stroke: "white", strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Info supplémentaire */}
          <div className="p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-[11px] sm:text-xs font-semibold text-foreground">
                  Comment interpréter l'ISP-FR ?
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  L'ISP-FR est un <span className="font-semibold text-foreground">index chaîné</span> qui mesure l'évolution globale du marché. Les variations sont calculées jour par jour avec les items présents.
                </p>
                <ul className="text-[11px] sm:text-xs text-muted-foreground space-y-0.5 ml-3">
                  <li>• <span className="font-semibold text-foreground">ISP-FR = 100</span> → Valeur de référence (base)</li>
                  <li>• <span className="font-semibold text-success">ISP-FR = 130</span> → Le marché a progressé de 30%</li>
                  <li>• <span className="font-semibold text-destructive">ISP-FR = 85</span> → Le marché a reculé de 15%</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Debug Section - Items responsables de la variation (Admin only) */}
          {isAdmin && debugData && (
            <Collapsible open={debugOpen} onOpenChange={setDebugOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-colors">
                <Bug className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  Debug : Variation du jour ({(debugData.dailyChange * 100).toFixed(2)}%)
                </span>
                <span className="text-xs text-muted-foreground ml-auto mr-2">
                  {debugData.itemCount} items · {debugData.dateBefore} → {debugData.dateAfter}
                </span>
                {debugOpen ? <ChevronUp className="w-4 h-4 text-orange-500" /> : <ChevronDown className="w-4 h-4 text-orange-500" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 border-b border-border">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                      <div className="col-span-5">Produit</div>
                      <div className="col-span-2 text-right">Avant</div>
                      <div className="col-span-2 text-right">Après</div>
                      <div className="col-span-3 text-right">Variation</div>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto divide-y divide-border">
                    {debugData.variations.slice(0, 30).map((item, idx) => (
                      <div
                        key={idx}
                        className={`grid grid-cols-12 gap-2 px-3 py-2 text-sm ${
                          item.impact === "hausse"
                            ? "bg-success/5"
                            : item.impact === "baisse"
                            ? "bg-destructive/5"
                            : ""
                        }`}
                      >
                        <div className="col-span-5 truncate font-medium text-foreground" title={item.name}>
                          {item.name}
                        </div>
                        <div className="col-span-2 text-right text-muted-foreground tabular-nums">
                          {item.priceBefore.toFixed(2)}€
                        </div>
                        <div className="col-span-2 text-right text-muted-foreground tabular-nums">
                          {item.priceAfter.toFixed(2)}€
                        </div>
                        <div
                          className={`col-span-3 text-right font-semibold tabular-nums ${
                            item.impact === "hausse"
                              ? "text-success"
                              : item.impact === "baisse"
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.change > 0 ? "+" : ""}
                          {(item.change * 100).toFixed(2)}%
                        </div>
                      </div>
                    ))}
                    {debugData.variations.length === 0 && (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        Aucun item avec des prix les deux jours
                      </div>
                    )}
                  </div>
                  {debugData.variations.length > 30 && (
                    <div className="px-3 py-2 bg-muted/30 text-xs text-muted-foreground text-center border-t border-border">
                      ... et {debugData.variations.length - 30} autres items
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  💡 Les items sont triés par impact absolu sur l'index (plus grande variation en premier).
                </p>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
