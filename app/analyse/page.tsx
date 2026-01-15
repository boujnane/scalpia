"use client";

import { useEffect, useState } from "react";
import { Item } from "@/lib/analyse/types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AnalyseTabs from "@/components/analyse/AnalyseTabs";
import { Icons } from "@/components/icons";
import AnalyseDashboard from "@/components/analyse/AnalyseDashboard";
import ISPIndexCard from "@/components/analyse/ISPIndexCard";
import SeriesHeatMap from "@/components/analyse/SeriesHeatMap";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSeriesFinance } from "@/hooks/useSeriesFinance";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

// Constante pour gérer la valeur par défaut de l'accordéon (ouvert sur desktop, fermé sur mobile si préféré)
// Ici, nous le gardons ouvert par défaut pour l'importance de la synthèse.
const DEFAULT_ACCORDION_VALUE = "dashboard";

export default function AnalysePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Logique de récupération de données ---
  useEffect(() => {
    async function fetchItems() {
      // ... (Votre logique de récupération Firebase)
      const querySnapshot = await getDocs(collection(db, "items"));
      const fetchedItems: Item[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as Omit<Item, "prices">;
        const pricesSnap = await getDocs(collection(db, `items/${docSnap.id}/prices`));
        const prices = pricesSnap.docs.map(p => p.data() as { date: string; price: number });
        fetchedItems.push({ ...data, prices });
      }

      setItems(fetchedItems);
      setLoading(false);
    }

    fetchItems();
  }, []);

  // ✅ Hook appelé AVANT le return conditionnel
  const { series } = useSeriesFinance(items, "all");

  if (loading) {
    // Application du thème au chargement (pas de changement nécessaire ici)
    return (
      <div className="p-4 sm:p-6 text-center text-lg text-muted-foreground flex flex-col items-center justify-center space-y-2 min-h-screen">
        <Icons.spinner className="w-6 h-6 animate-spin text-primary" />
        <p>Chargement des items...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1800px] mx-auto">
      {/* HERO SECTION */}
      <header className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Analyse du Marché
          </h1>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
          Suivez l'évolution du marché français des produits scellés Pokémon avec des indicateurs
          simples et des recommandations basées sur des données réelles.
        </p>
      </header>

      {/* ISP-FR INDEX CARD - STAR OF THE SHOW */}
      <ISPIndexCard items={items} />

      {/* TABS NAVIGATION */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-muted/50 p-1 w-full sm:w-auto grid grid-cols-3 sm:inline-flex rounded-xl">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4">
            <span className="hidden sm:inline">Vue d'ensemble</span>
            <span className="sm:hidden">Vue</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs sm:text-sm px-2 sm:px-4">
            <span className="hidden sm:inline">Analyse détaillée</span>
            <span className="sm:hidden">Analyse</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="text-xs sm:text-sm px-2 sm:px-4">
            Produits
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: VUE D'ENSEMBLE */}
        <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2">
          {/* Heat Map */}
          <SeriesHeatMap series={series} title="Performance des séries" metric="return30d" />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Séries en hausse</p>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-success tabular-nums">
                {series.filter((s) => s.trend7d === "up").length}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Sur 7 jours</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Séries en baisse</p>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-destructive tabular-nums">
                {series.filter((s) => s.trend7d === "down").length}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Sur 7 jours</p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">Séries stables</p>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                </div>
              </div>
              <p className="text-3xl sm:text-4xl font-extrabold text-muted-foreground tabular-nums">
                {series.filter((s) => s.trend7d === "stable").length}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Sur 7 jours</p>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: ANALYSE DÉTAILLÉE */}
        <TabsContent value="analysis" className="animate-in fade-in-50 slide-in-from-bottom-2">
          <Accordion type="single" collapsible defaultValue={DEFAULT_ACCORDION_VALUE} className="w-full">
            <AccordionItem value="dashboard" className="border-b-0">
              <AccordionTrigger className="text-left py-3 sm:py-4 px-2 sm:px-4 hover:bg-muted/50 rounded-xl transition-colors bg-card shadow-sm border border-border">
                <div className="flex items-start space-x-3 w-full">
                  <Icons.activity className="w-5 h-5 mt-3 text-primary shrink-0" />
                  <div className="flex flex-col flex-grow min-w-0">
                    <span className="font-extrabold text-base sm:text-lg text-foreground truncate">
                      Analyse Financière par Série
                    </span>
                    <span className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
                      Métriques avancées et scores de performance
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5 block sm:hidden">
                      Métriques & scores
                    </span>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="pt-2 pb-0 sm:pt-4">
                <AnalyseDashboard items={items} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        {/* TAB 3: PRODUITS */}
        <TabsContent value="products" className="animate-in fade-in-50 slide-in-from-bottom-2">
          <div className="space-y-4">
            <header>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Détail des produits scellés
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Visualisez les prix et l'évolution des différents types d'items par bloc.
              </p>
            </header>

            <section className="bg-card p-2 sm:p-4 rounded-xl shadow-lg border border-border">
              <AnalyseTabs items={items} />
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}