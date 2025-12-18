import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Item } from "@/lib/analyse/types";
import { getBlocImage } from "@/lib/utils";
import { SeriesTrendChart } from "./SeriesTrendChart"; // Ton composant existant

// Icons & UI Components
import { 
  TrendingUp, TrendingDown, Minus, Search, 
  ArrowUpDown, LayoutGrid, List, AlertCircle 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SeriesSummary, useSeriesAnalytics } from "@/hooks/useSeriesAnalytics";

// --- SUB-COMPONENTS (Pour alléger le code) ---

const TrendBadge = ({ trend, value, suffix = "" }: { trend?: "up" | "down" | "stable", value?: number, suffix?: string }) => {
  if (value === undefined) return <span className="text-muted-foreground">-</span>;
  
  const isUp = trend === "up" || (trend === undefined && value > 0);
  const isDown = trend === "down" || (trend === undefined && value < 0);
  const colorClass = isUp ? "text-emerald-600 dark:text-emerald-500" : isDown ? "text-rose-600 dark:text-rose-500" : "text-muted-foreground";
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <div className={`flex items-center gap-1.5 font-bold ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{value > 0 && "+"}{(value * 100).toFixed(2)}%{suffix}</span>
    </div>
  );
};

const KpiCard = ({ title, value, icon: Icon, subtext, variant = "default" }: any) => {
  const colors = {
    default: "text-foreground",
    success: "text-emerald-600 dark:text-emerald-500",
    danger: "text-rose-600 dark:text-rose-500",
    blue: "text-blue-600 dark:text-blue-500"
  };
  const bgColors = {
    default: "bg-muted",
    success: "bg-emerald-500/10",
    danger: "bg-rose-500/10",
    blue: "bg-blue-500/10"
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <div className={`text-2xl sm:text-3xl font-bold ${colors[variant as keyof typeof colors]}`}>
            {value}
          </div>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${bgColors[variant as keyof typeof bgColors]}`}>
          <Icon className={`w-5 h-5 ${colors[variant as keyof typeof colors]}`} />
        </div>
      </CardContent>
    </Card>
  );
};

// --- MAIN COMPONENT ---

interface AnalyseDashboardProps {
  items: Item[];
}

export default function AnalyseDashboard({ items }: AnalyseDashboardProps) {
  const [selectedBloc, setSelectedBloc] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof SeriesSummary; direction: 'asc' | 'desc' }>({ 
    key: 'averageVariation', 
    direction: 'desc' 
  });

  // 1. Hook de calcul
  const { blocs, data, kpis } = useSeriesAnalytics(items, selectedBloc);

  // 2. Filtrage et Tri (UI Logic)
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Recherche
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.seriesName.toLowerCase().includes(q));
    }

    // Tri
    result.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Gestion des undefined (pour shortTermTrend par ex)
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, searchQuery, sortConfig]);

  // Handler pour le tri
  const requestSort = (key: keyof SeriesSummary) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-muted-foreground/30 ml-2" />;
    return sortConfig.direction === 'asc' 
      ? <TrendingUp className="w-3 h-3 text-primary ml-2 rotate-180" /> 
      : <TrendingDown className="w-3 h-3 text-primary ml-2 rotate-180" />; 
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center bg-card/50 p-6 rounded-3xl border shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-5">
          {selectedBloc !== "all" && getBlocImage(selectedBloc) ? (
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-sm border bg-white dark:bg-black shrink-0">
              <Image src={getBlocImage(selectedBloc)!} alt={selectedBloc} fill className="object-contain p-2" />
            </div>
          ) : (
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <LayoutGrid className="w-8 h-8" />
             </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Analyse Marché</h1>
            <p className="text-muted-foreground font-medium text-sm sm:text-base">
              {selectedBloc === 'all' ? "Vue globale des performances" : `Focus : Bloc ${selectedBloc}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Recherche */}
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filtrer les séries..." 
              className="pl-9 bg-background/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Selecteur Bloc */}
          <Select value={selectedBloc} onValueChange={setSelectedBloc}>
            <SelectTrigger className="w-full sm:w-[220px] bg-background/50">
              <SelectValue placeholder="Choisir un bloc" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="font-semibold">Tous les blocs</span>
              </SelectItem>
              {blocs.map(b => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Séries Analysées" 
          value={kpis.totalSeries} 
          icon={List} 
          variant="blue" 
          subtext="Ensembles de cartes"
        />
        <KpiCard 
          title="Variation Moyenne" 
          value={`${kpis.avgVar > 0 ? "+" : ""}${(kpis.avgVar * 100).toFixed(2)}%`} 
          icon={TrendingUp} 
          variant={kpis.avgVar >= 0 ? "success" : "danger"} 
          subtext="Vs Prix Retail"
        />
        <KpiCard 
          title="En Hausse" 
          value={kpis.upCount} 
          icon={TrendingUp} 
          variant="success" 
          subtext={`${((kpis.upCount / kpis.totalSeries) * 100 || 0).toFixed(0)}% du marché`}
        />
        <KpiCard 
          title="En Baisse" 
          value={kpis.downCount} 
          icon={TrendingDown} 
          variant="danger" 
          subtext={`${((kpis.downCount / kpis.totalSeries) * 100 || 0).toFixed(0)}% du marché`}
        />
      </div>

      {/* TABS CONTENT */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full sm:w-auto grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="overview">
            <span className="sm:hidden">Vue & Graph</span>
            <span className="hidden sm:inline">Vue d'ensemble & Graphique</span>
          </TabsTrigger>

          <TabsTrigger value="data">
            <span className="sm:hidden">Données</span>
            <span className="hidden sm:inline">Données Détaillées</span>
          </TabsTrigger>
        </TabsList>


        {/* TAB 1: VISUALISATION */}
        <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GRAPHIQUE PRINCIPAL */}
            <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>Tendances Comparatives</CardTitle>
                <CardDescription>Performance pondérée de toutes les séries par rapport au prix Retail depuis la sortie</CardDescription>
              </CardHeader>
              <CardContent className="p-0 sm:p-6">
                {/* On passe les données filtrées au graphique pour qu'il réagisse à la recherche */}
                <SeriesTrendChart data={filteredAndSortedData} />
              </CardContent>
            </Card>

            {/* TOP PERFORMERS SIDEBAR */}
            <Card className="border-border/50 shadow-sm flex flex-col h-full max-h-[800px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Top Performers
                </CardTitle>
                <CardDescription>Les séries les plus rentables</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto pr-2 space-y-1">
                {/* On prend le top 10 des données filtrées */}
                {filteredAndSortedData
                  .filter(s => s.averageVariation > 0)
                  .sort((a, b) => b.averageVariation - a.averageVariation)
                  .slice(0, 15)
                  .map((series, idx) => (
                    <div 
                      key={series.seriesName} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-border/50"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="font-mono text-xs text-muted-foreground w-4 text-center shrink-0">{idx + 1}</div>
                        <div className="font-medium text-sm truncate capitalize group-hover:text-primary transition-colors">
                          {series.seriesName}
                        </div>
                      </div>
                      <TrendBadge value={series.averageVariation} />
                    </div>
                  ))}
                  {filteredAndSortedData.filter(s => s.averageVariation > 0).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Aucune donnée positive trouvée
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: TABLEAU DE DONNÉES */}
        <TabsContent value="data" className="animate-in slide-in-from-bottom-2">
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead 
                      className="w-[300px] cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => requestSort('seriesName')}
                    >
                      <div className="flex items-center">Série <SortIcon columnKey="seriesName" /></div>
                    </TableHead>
                    
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                      onClick={() => requestSort('averageVariation')}
                    >
                      <div className="flex items-center justify-end">Variation Totale <SortIcon columnKey="averageVariation" /></div>
                    </TableHead>

                    <TableHead className="text-center">Prix Moyen (Min-Max)</TableHead>
                    
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors text-center"
                      onClick={() => requestSort('shortTermVariation')}
                    >
                       <div className="flex items-center justify-center">Tendance 7j <SortIcon columnKey="shortTermVariation" /></div>
                    </TableHead>
                    
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 transition-colors text-right"
                      onClick={() => requestSort('coverageIndex')}
                    >
                       <div className="flex items-center justify-end">Indice Couverture <SortIcon columnKey="coverageIndex" /></div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((series) => (
                    <TableRow key={series.seriesName} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium capitalize">
                        <div className="flex items-center gap-2">
                          {series.coverageIndex < 1.0 && (
                             <TooltipProvider>
                               <Tooltip>
                                 <TooltipTrigger>
                                   <AlertCircle className="h-4 w-4 text-yellow-500" />
                                 </TooltipTrigger>
                                 <TooltipContent>Données partielles</TooltipContent>
                               </Tooltip>
                             </TooltipProvider>
                          )}
                          {series.seriesName}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                           <TrendBadge value={series.averageVariation} trend={series.longTermTrend} />
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center tabular-nums text-sm">
                        <span className="text-muted-foreground">{series.minPrice.toFixed(0)}€</span>
                        <span className="mx-1 opacity-30">-</span>
                        <span className="font-semibold">{series.maxPrice.toFixed(0)}€</span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        {series.hasRecentData ? (
                          <div className="inline-flex justify-center">
                             <Badge variant={series.shortTermTrend === "up" ? "success" : series.shortTermTrend === "down" ? "destructive" : "secondary"} className="font-normal">
                                {series.shortTermTrend === "up" ? "Hausse" : series.shortTermTrend === "down" ? "Baisse" : "Stable"}
                             </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Pas de data récente</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-right">
                         <div className="flex items-center justify-end gap-2">
                           <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                             <div 
                               className={`h-full ${series.coverageIndex >= 1 ? 'bg-primary' : 'bg-yellow-500'}`} 
                               style={{ width: `${Math.min(series.coverageIndex * 100, 100)}%` }}
                             />
                           </div>
                           <span className="text-xs text-muted-foreground w-8">{(series.coverageIndex * 100).toFixed(0)}%</span>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredAndSortedData.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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