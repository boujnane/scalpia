import { Item } from "@/lib/analyse/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeriesSummary, SeriesTrendChart } from "./SeriesTrendChart";
import { TrendingUp, TrendingDown, Minus, AlertCircle, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { aggregatePricesByDay, getBlocImage } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import Image from "next/image";

interface AnalyseDashboardProps {
  items: Item[];
}

function calculateTrend(
  prices: { date: string; price: number }[],
  daysBack?: number  // undefined = tout l'historique
): { trend: "up" | "down" | "stable"; variation: number } {
  
  if (prices.length < 2) {
    return { trend: "stable", variation: 0 };
  }

  // Filtrer par période si spécifié
  let filteredPrices = prices;
  if (daysBack !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    filteredPrices = prices.filter(
      p => new Date(p.date) >= cutoffDate
    );
  }

  if (filteredPrices.length < 2) {
    return { trend: "stable", variation: 0 };
  }

  const firstPrice = filteredPrices[0].price;
  const lastPrice = filteredPrices[filteredPrices.length - 1].price;
  const variation = (lastPrice - firstPrice) / firstPrice;

  let trend: "up" | "down" | "stable" = "stable";
  if (variation > 0.05) trend = "up";       // +5%
  else if (variation < -0.05) trend = "down"; // -5%

  return { trend, variation };
}

function normalizeSeriesName(name: string): string {
  let normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const ignoreWords = ["rugit", "garde", "lucario", "gardevoir"];
  ignoreWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    normalized = normalized.replace(regex, "");
  });
  normalized = normalized.replace(/\s+/g, " ").trim();
  const fusionMap: Record<string, string> = {
    "koraidon ev": "ecarlate et violet",
    "miraidon ev": "ecarlate et violet",
    "mega evolution 1": "mega evolution",
    "vert forces temporelles": "forces temporelles",
    "serpente forces temporelles": "forces temporelles"
  };
  return fusionMap[normalized] ?? normalized;
}

export default function AnalyseDashboard({ items }: AnalyseDashboardProps) {
  const [selectedBloc, setSelectedBloc] = useState<string>("all");

  const blocs = useMemo(() => {
    const unique = new Set<string>();
    items.forEach(i => {
      if ((i as any).bloc) unique.add((i as any).bloc);
    });
    return Array.from(unique).sort();
  }, [items]);

  const typeWeights: Record<string, number> = {
    ETB: 0.40,
    "Tri-Pack": 0.15,
    Display: 0.20,
    Bundle: 0.15,
    Artset: 0.07,
    "Demi-Display": 0.03
  };

  const MAX_POSSIBLE_WEIGHT = Object.values(typeWeights).reduce((a, b) => a + b, 0);

  const filteredItems = items.filter(item => {
    if (item.type === "UPC") return false;
    if (selectedBloc === "all") return true;
    return (item as any).bloc === selectedBloc;
  });
  const seriesMap = new Map<string, Item[]>();
  
  filteredItems.forEach(item => {
    const seriesName = normalizeSeriesName(item.name);
    if (!seriesMap.has(seriesName)) seriesMap.set(seriesName, []);
    seriesMap.get(seriesName)!.push(item);
  });

  const seriesSummaries: SeriesSummary[] = Array.from(seriesMap.entries()).map(
    ([seriesName, itemsInSeries]) => {
      const itemsByType = new Map<string, Item[]>();
      itemsInSeries.forEach(item => {
        if (!itemsByType.has(item.type)) itemsByType.set(item.type, []);
        itemsByType.get(item.type)!.push(item);
      });

      let weightedSum = 0;
      let totalWeightUsed = 0;
      let maxWeightForSeries = 0;

      itemsByType.forEach((itemsOfSameType, itemType) => {
        const weight = typeWeights[itemType] ?? 0;
        if (weight === 0 || itemsOfSameType.length === 0) return;

        maxWeightForSeries += weight;

        const variations = itemsOfSameType.flatMap(i => {
          if (!i.retailPrice || i.retailPrice === 0 || (i.prices ?? []).length === 0) return [];
          const lastPrice = i.prices!.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].price;
          return (lastPrice - i.retailPrice) / i.retailPrice;
        });

        if (variations.length === 0) return;

        const typeAvgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
        weightedSum += typeAvgVariation * weight;
        totalWeightUsed += weight;
      });
      
      const averageVariation = totalWeightUsed > 0 ? weightedSum / totalWeightUsed : 0;
      const coverageIndex = parseFloat((totalWeightUsed / MAX_POSSIBLE_WEIGHT).toFixed(2));

      const allPrices = itemsInSeries.flatMap(item => (item.prices ?? []).map(p => p.price));
      const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
      const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

      const allPriceHistory = itemsInSeries.flatMap(item => item.prices || []);
      allPriceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const aggregatedPrices = aggregatePricesByDay(allPriceHistory);

      const longTermTrend: "up" | "down" | "stable" = 
        averageVariation > 0.05 ? "up" :      // > +5%
        averageVariation < -0.05 ? "down" :   // < -5%
        "stable";

      // Calcul court terme (7 derniers jours)
      const shortTermResult = calculateTrend(aggregatedPrices, 7);
      const hasRecentData = aggregatedPrices.some(p => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        return new Date(p.date) >= cutoffDate;
      });

      return {
        seriesName,
        averageVariation,
        minPrice,
        maxPrice,
        longTermTrend,  // Basé sur variation pondérée
        shortTermTrend: hasRecentData ? shortTermResult.trend : undefined,
        shortTermVariation: hasRecentData ? shortTermResult.variation : undefined,
        coverageIndex,
        hasRecentData
      };
    }
  );

  seriesSummaries.sort((a, b) => b.averageVariation - a.averageVariation);

  const totalSeriesCount = seriesSummaries.length;
  const risingSeriesCount = seriesSummaries.filter(s => s.longTermTrend === 'up').length;
  const fallingSeriesCount = seriesSummaries.filter(s => s.longTermTrend === 'down').length;
  const avgVariation = seriesSummaries.reduce((sum, s) => sum + s.averageVariation, 0) / totalSeriesCount;

  const getTrendIcon = (trend: "up" | "down" | "stable" | undefined, isActive: boolean = false) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getVariationColor = (variation: number) => {
    if (variation > 0) return "text-success";
    if (variation < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 1.0) return "text-success";
    if (coverage >= 0.7) return "text-yellow-600 dark:text-yellow-500";
    return "text-destructive";
  };

  return (
    <div className="space-y-6 p-3 sm:p-6 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        
        {/* Grosse image du bloc */}
        {selectedBloc !== "all" && getBlocImage(selectedBloc) ? (
          <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-xl bg-muted shadow-inner overflow-hidden shrink-0">
            <Image
              src={getBlocImage(selectedBloc)!}
              alt={selectedBloc}
              fill
              className="object-contain p-2"
              priority
            />
          </div>
        ) : (
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BarChart3 className="w-10 h-10 sm:w-14 sm:h-14 text-primary" />
          </div>
        )}

        {/* Texte */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
            Analyse des séries
          </h1>

          {selectedBloc !== "all" && (
            <div className="text-sm sm:text-base text-muted-foreground font-medium">
              Bloc <span className="font-semibold">{selectedBloc}</span>
            </div>
          )}

          <p className="text-xs sm:text-sm text-muted-foreground">
            Vue d'ensemble des performances et tendances du marché
          </p>
        </div>
      </div>


{/* Bloc Filter */}
<Card className="border-border/50 shadow-sm">
  <CardContent className="p-2 sm:p-3 flex flex-col sm:flex-row gap-4 sm:items-start">
    
    {/* Section gauche : Label + Select */}
    <div className="flex flex-col gap-1 sm:w-[260px]">
      <div className="text-sm font-medium">
        Bloc analysé
      </div>
      <Select value={selectedBloc} onValueChange={setSelectedBloc}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Tous les blocs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs font-semibold">
                ALL
              </div>
              Tous les blocs
            </div>
          </SelectItem>

          {blocs.map(bloc => (
            <SelectItem key={bloc} value={bloc}>
              <div className="flex items-center gap-2">
                {getBlocImage(bloc) ? (
                  <Image
                    src={getBlocImage(bloc)!}
                    alt={bloc}
                    width={20}
                    height={20}
                    className="rounded-sm"
                  />
                ) : (
                  <div className="w-5 h-5 rounded bg-muted text-xs flex items-center justify-center">
                    {bloc}
                  </div>
                )}
                <span>{bloc}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Section droite : description */}
    <div className="flex-1 text-xs sm:text-sm text-muted-foreground sm:mt-0 pl-4">
      Sélectionnez un bloc pour visualiser ses tendances. Les variations pondérées sont calculées par rapport aux prix retail, 
      et l'indice de couverture (IC) reflète la proportion des types de produits pris en compte dans le calcul.
    </div>

  </CardContent>
</Card>



      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Séries Analysées
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl sm:text-3xl font-bold">{totalSeriesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ensembles uniques
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Variation Moyenne
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className={`text-2xl sm:text-3xl font-bold ${getVariationColor(avgVariation)}`}>
              {(avgVariation * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Par rapport au retail
            </p>
          </CardContent>
        </Card>

        <Card className="border-success/20 bg-success/5 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Tendances Positives
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-success">
              {risingSeriesCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((risingSeriesCount / totalSeriesCount) * 100).toFixed(1)}% des séries
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Tendances Négatives
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-destructive">
              {fallingSeriesCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((fallingSeriesCount / totalSeriesCount) * 100).toFixed(1)}% des séries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Visualisation des variations</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Comparaison des performances par série
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <SeriesTrendChart data={seriesSummaries} />
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Détail par série</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Variation pondérée par rapport au prix retail. L'IC reflète la couverture des types de produits.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          {/* Mobile View - Cards */}
          <div className="block lg:hidden space-y-3 p-4">
            {seriesSummaries.map((series) => (
              <Card
                key={series.seriesName}
                className={`border ${
                  series.coverageIndex < 1.0
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-border/50"
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm capitalize leading-tight flex-1">
                      {series.seriesName}
                    </h3>
                    <Badge
                      variant={
                        series.longTermTrend === "up"
                          ? "default"
                          : series.longTermTrend === "down"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      <span className="flex items-center gap-1">
                        {getTrendIcon(series.longTermTrend)}
                        <span className="text-xs">
                          {series.longTermTrend === "up" ? "Hausse" : series.longTermTrend === "down" ? "Baisse" : "Stable"}
                        </span>
                      </span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-muted-foreground mb-1">Variation</div>
                      <div className={`text-lg font-bold ${getVariationColor(series.averageVariation)}`}>
                        {(series.averageVariation * 100).toFixed(2)}%
                      </div>
                    </div>

                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <div className="text-muted-foreground mb-1 flex items-center gap-1">
                                IC
                                {series.coverageIndex < 1.0 && (
                                  <AlertCircle className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                              <div className={`text-lg font-bold ${getCoverageColor(series.coverageIndex)}`}>
                                {(series.coverageIndex * 100).toFixed(0)}%
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Indice de Couverture</p>
                            <p className="text-xs text-muted-foreground">
                              {series.coverageIndex < 1.0 ? "Types manquants détectés" : "Couverture complète"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="col-span-2">
                      <div className="text-muted-foreground mb-1">Fourchette de prix</div>
                      <div className="font-semibold">
                        {series.minPrice.toFixed(2)} - {series.maxPrice.toFixed(2)} €
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px] font-semibold">Série</TableHead>
                  <TableHead className="font-semibold">Variation Pondérée</TableHead>
                  <TableHead className="font-semibold">Fourchette (€)</TableHead>
                  <TableHead className="text-center font-semibold">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="cursor-help">
                          IC
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Indice de Couverture</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="text-right font-semibold">Tendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seriesSummaries.map((series) => (
                  <TableRow
                    key={series.seriesName}
                    className={`${
                      series.coverageIndex < 1.0
                        ? "bg-yellow-500/5 hover:bg-yellow-500/10"
                        : "hover:bg-muted/50"
                    } transition-colors`}
                  >
                    <TableCell className="font-medium capitalize">
                      <div className="flex items-center gap-2">
                        {series.coverageIndex < 1.0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">Types de produits manquants</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        <span className="truncate">{series.seriesName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold text-base ${getVariationColor(series.averageVariation)}`}>
                        {series.averageVariation > 0 && "+"}
                        {(series.averageVariation * 100).toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <span className="text-muted-foreground">{series.minPrice.toFixed(2)}</span>
                      {" - "}
                      <span className="font-semibold">{series.maxPrice.toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={series.coverageIndex >= 1.0 ? "default" : "secondary"}
                        className={
                          series.coverageIndex < 1.0
                            ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/30"
                            : "bg-success/10 text-success border-success/30"
                        }
                      >
                        {(series.coverageIndex * 100).toFixed(0)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                    <div className="flex flex-col gap-1 items-end justify-center">
                      {/* Long terme */}
                      <Badge 
                        variant={
                          series.longTermTrend === "up"
                            ? "default"
                            : series.longTermTrend === "down"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          series.longTermTrend === "up"
                            ? "bg-success/10 text-success border-success/30"
                            : series.longTermTrend === "down"
                            ? "bg-destructive/10 text-destructive border-destructive/30"
                            : ""
                        }
                      >
                        <span className="flex items-center gap-1.5">
                          {getTrendIcon(series.longTermTrend)}
                          <span>Global</span>
                        </span>
                      </Badge>
                      
                      {/* Court terme (si disponible) */}
                      {series.hasRecentData && series.shortTermTrend && (
                        <Badge 
                        variant={
                          series.shortTermTrend === "up"
                            ? "success"
                            : series.shortTermTrend === "down"
                            ? "destructive"
                            : "secondary"
                        } 
                          className="text-xs"
                        >
                          {getTrendIcon(series.shortTermTrend)}
                          <span>7j: {(series.shortTermVariation! * 100).toFixed(1)}%</span>
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}