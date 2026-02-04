"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  Package,
  Clock,
  AlertTriangle,
  ChevronRight,
  HelpCircle,
  Calendar,
  RefreshCw,
  Layers,
  ArrowRight,
  Info,
  ExternalLink,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { useAnalyseItems } from "@/hooks/useAnalyseItems";
import { computeISPFromItems } from "@/lib/analyse/finance/ispIndex";
import { cn } from "@/lib/utils";

type ProductType = "ETB" | "Display" | "Blister" | "Coffret";

export default function HistoriquePrixPokemonPage() {
  const { items, loading } = useAnalyseItems();
  const [selectedType, setSelectedType] = useState<ProductType>("Display");

  const ispSummary = useMemo(() => {
    if (!items || items.length === 0) return null;
    return computeISPFromItems(items);
  }, [items]);

  // Filtrer les items par type et calculer les moyennes historiques
  const typeData = useMemo(() => {
    if (!items || items.length === 0) return null;

    const typeGroups: Record<string, typeof items> = {
      ETB: items.filter((i) => i.type === "ETB"),
      Display: items.filter((i) => i.type === "Display" || i.type === "Demi-Display"),
      Blister: items.filter((i) => i.type === "Tri-Pack" || i.type?.toLowerCase().includes("booster")),
      Coffret: items.filter((i) => i.type === "Coffret" || i.type === "UPC" || i.type === "Bundle" || i.type === "Pokébox"),
    };

    return typeGroups;
  }, [items]);

  // Préparer les données pour le graphique ISP
  const chartData = useMemo(() => {
    if (!ispSummary?.history) return [];
    return ispSummary.history.slice(-90).map((point) => ({
      date: point.date,
      value: point.value,
      formattedDate: new Date(point.date).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      }),
    }));
  }, [ispSummary]);

  // Stats par type de produit
  const typeStats = useMemo(() => {
    if (!typeData) return null;

    const stats: Record<string, { count: number; avgPrice: number | null; trend: string }> = {};

    for (const [type, typeItems] of Object.entries(typeData)) {
      const prices = typeItems
        .map((item) => {
          const lastPrice = item.prices?.[item.prices.length - 1]?.price;
          return lastPrice;
        })
        .filter((p): p is number => p !== undefined && p > 0);

      stats[type] = {
        count: typeItems.length,
        avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
        trend: Math.random() > 0.5 ? "up" : "down", // Placeholder - would need real calculation
      };
    }

    return stats;
  }, [typeData]);

  const formatPercent = (value: number | null) => {
    if (value === null) return "N/A";
    const formatted = (value * 100).toFixed(1);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-xl p-3">
        <p className="text-sm font-medium">{data.formattedDate}</p>
        <p className="text-lg font-bold text-primary">{data.value.toFixed(2)}</p>
      </div>
    );
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Historique des prix Pokémon scellés",
            description:
              "Suivez l'évolution des prix des boosters, displays et coffrets Pokémon scellés. Données historiques du marché secondaire français mises à jour quotidiennement.",
            author: {
              "@type": "Organization",
              name: "Pokéindex",
              url: "https://www.pokeindex.fr",
            },
            publisher: {
              "@type": "Organization",
              name: "Pokéindex",
              logo: {
                "@type": "ImageObject",
                url: "https://www.pokeindex.fr/logo/logo_pki.png",
              },
            },
            datePublished: "2025-01-15",
            dateModified: new Date().toISOString().split("T")[0],
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": "https://www.pokeindex.fr/historique-prix-pokemon",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Les prix affichés sont-ils des prix de vente réels ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Les prix affichés sont des prix planchers observés sur les principales plateformes de vente (Cardmarket, eBay, Vinted, LeBonCoin). Il s'agit de prix d'annonces, pas nécessairement de prix de transactions effectives.",
                },
              },
              {
                "@type": "Question",
                name: "À quelle fréquence les données sont-elles mises à jour ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Les données sont mises à jour quotidiennement par nos agents. Chaque jour, nous scannons les principales plateformes pour récupérer les prix les plus récents.",
                },
              },
              {
                "@type": "Question",
                name: "Pourquoi certains produits varient fortement ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Les variations peuvent être dues à plusieurs facteurs : annonce de reprint, sortie d'une nouvelle extension, effet de hype sur les réseaux sociaux, ou simplement une offre exceptionnelle qui fait baisser le prix plancher.",
                },
              },
              {
                "@type": "Question",
                name: "Peut-on prédire l'évolution future des prix Pokémon ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Non, personne ne peut prédire l'avenir avec certitude. Les données historiques permettent d'identifier des tendances, mais le marché reste imprévisible. Les performances passées ne garantissent pas les résultats futurs.",
                },
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Accueil",
                item: "https://www.pokeindex.fr",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Historique des prix Pokémon scellés",
              },
            ],
          }),
        }}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <header className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              <Link href="/" className="hover:text-foreground transition">
                Accueil
              </Link>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-foreground">Historique des prix</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Historique des prix{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Pokémon scellés
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              Suivre l'historique des prix des produits Pokémon scellés permet de comprendre les
              tendances du marché et d'anticiper ses évolutions. Cette page présente l'évolution des
              prix des boosters, displays et coffrets Pokémon à partir de données du marché
              secondaire français.
            </p>

            {/* Quick Stats */}
            <div className="mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-card border border-border/50">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span className="text-xs sm:text-sm">
                  Depuis <span className="font-semibold">déc. 2025</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-card border border-border/50">
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" />
                <span className="text-xs sm:text-sm">
                  MAJ <span className="font-semibold">quotidienne</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-card border border-border/50">
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                <span className="text-xs sm:text-sm">
                  <span className="font-semibold">{items?.length ?? "..."}</span> produits
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-16">
          {/* Section 1: Pourquoi analyser */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <BarChart3 className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              Pourquoi analyser l'historique des prix Pokémon ?
            </h2>

            <p className="text-muted-foreground leading-relaxed mb-8">
              Comprendre l'évolution passée des prix est essentiel pour tout collectionneur ou
              investisseur. Voici ce que l'analyse historique vous permet de faire :
            </p>

            <div className="grid sm:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <CardContent className="pt-6">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Identifier les cycles</h3>
                  <p className="text-sm text-muted-foreground">
                    Le marché Pokémon suit des cycles de hype et de correction. Les reconnaître
                    aide à mieux timer ses achats et ventes.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-success/5 to-transparent border-success/20">
                <CardContent className="pt-6">
                  <div className="p-3 rounded-xl bg-success/10 w-fit mb-4">
                    <AlertTriangle className="w-6 h-6 text-success" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Éviter d'acheter au plus haut</h3>
                  <p className="text-sm text-muted-foreground">
                    Voir qu'un produit est à son plus haut historique peut vous inciter à
                    attendre une correction avant d'acheter.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="p-3 rounded-xl bg-purple-500/10 w-fit mb-4">
                    <Package className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Comparer les éditions</h3>
                  <p className="text-sm text-muted-foreground">
                    Certaines séries performent mieux que d'autres. L'historique révèle les
                    tendances par extension.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">💡 Conseil :</span> Consultez notre
                guide{" "}
                <Link href="/investir-pokemon" className="text-primary font-medium hover:underline">
                  Investir dans les cartes Pokémon
                </Link>{" "}
                pour une analyse complète des facteurs de rentabilité.
              </p>
            </div>
          </section>

          {/* Section 2: Graphique ISP-FR */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              Évolution globale du marché (ISP-FR)
            </h2>

            <p className="text-muted-foreground leading-relaxed mb-6">
              L'<span className="font-semibold text-foreground">ISP-FR</span> (Index du Scellé
              Pokémon FR) mesure l'évolution moyenne de tous les produits scellés. Base 100 au
              démarrage de l'index.
            </p>

            {loading ? (
              <Skeleton className="h-80 w-full rounded-xl" />
            ) : ispSummary ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span>ISP-FR</span>
                        <Badge variant="secondary" className="font-mono">
                          {ispSummary.current.toFixed(2)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Évolution sur les 90 derniers jours
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-2xl font-bold tabular-nums",
                          (ispSummary.change30d ?? 0) >= 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {formatPercent(ispSummary.change30d)}
                      </p>
                      <p className="text-xs text-muted-foreground">sur 30 jours</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-56 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="rgb(59, 130, 246)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis
                          dataKey="formattedDate"
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                          tickLine={false}
                        />
                        <YAxis
                          domain={["dataMin - 2", "dataMax + 2"]}
                          tick={{ fontSize: 11 }}
                          className="text-muted-foreground"
                          tickLine={false}
                          tickFormatter={(v) => v.toFixed(0)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="rgb(59, 130, 246)"
                          strokeWidth={2.5}
                          fill="url(#colorValue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats row */}
                  <div className="mt-4 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">7 jours</p>
                      <p
                        className={cn(
                          "font-semibold tabular-nums",
                          (ispSummary.change7d ?? 0) >= 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {formatPercent(ispSummary.change7d)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">30 jours</p>
                      <p
                        className={cn(
                          "font-semibold tabular-nums",
                          (ispSummary.change30d ?? 0) >= 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {formatPercent(ispSummary.change30d)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">90 jours</p>
                      <p
                        className={cn(
                          "font-semibold tabular-nums",
                          (ispSummary.change90d ?? 0) >= 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {formatPercent(ispSummary.change90d)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">YTD</p>
                      <p
                        className={cn(
                          "font-semibold tabular-nums",
                          (ispSummary.changeYTD ?? 0) >= 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {formatPercent(ispSummary.changeYTD)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </section>

          {/* Section 3: Prix par type de produit */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Package className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              Évolution des prix par type de produit
            </h2>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Les différents types de produits (boosters, displays, coffrets) n'évoluent pas de la
              même façon. Voici un aperçu par catégorie.
            </p>

            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : typeStats ? (
              <div className="space-y-6">
                {/* Type selector tabs */}
                <Tabs
                  value={selectedType}
                  onValueChange={(v) => setSelectedType(v as ProductType)}
                >
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 sm:gap-0">
                    <TabsTrigger value="Display" className="text-xs sm:text-sm py-2">Displays</TabsTrigger>
                    <TabsTrigger value="ETB" className="text-xs sm:text-sm py-2">ETB</TabsTrigger>
                    <TabsTrigger value="Coffret" className="text-xs sm:text-sm py-2">Coffrets</TabsTrigger>
                    <TabsTrigger value="Blister" className="text-xs sm:text-sm py-2">Blisters</TabsTrigger>
                  </TabsList>

                  {(["Display", "ETB", "Coffret", "Blister"] as const).map((type) => (
                    <TabsContent key={type} value={type}>
                      <Card>
                        <CardHeader className="space-y-3">
                          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-base sm:text-lg">
                              {type === "Display" && "Displays (Boîtes de 36 boosters)"}
                              {type === "ETB" && "Elite Trainer Box (ETB)"}
                              {type === "Coffret" && "Coffrets & UPC"}
                              {type === "Blister" && "Blisters & Tri-Packs"}
                            </span>
                            <Badge variant="outline" className="w-fit">
                              {typeStats[type]?.count ?? 0} produits
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {type === "Display" &&
                              "Les displays offrent généralement le meilleur ratio coût/booster pour les investisseurs."}
                            {type === "ETB" &&
                              "Format premium très apprécié des collectionneurs pour sa présentation et ses exclusivités."}
                            {type === "Coffret" &&
                              "Incluant les UPC, bundles et coffrets collection. Fort potentiel mais volatile."}
                            {type === "Blister" &&
                              "Format le plus accessible, suivi pour les éditions anciennes ou rares."}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
                              <p className="text-xs text-muted-foreground">Produits suivis</p>
                              <p className="text-xl sm:text-2xl font-bold tabular-nums">
                                {typeStats[type]?.count ?? 0}
                              </p>
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
                              <p className="text-xs text-muted-foreground">Prix moyen actuel</p>
                              <p className="text-xl sm:text-2xl font-bold tabular-nums">
                                {typeStats[type]?.avgPrice
                                  ? `${typeStats[type].avgPrice.toFixed(0)}€`
                                  : "N/A"}
                              </p>
                            </div>
                            <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
                              <p className="text-xs text-muted-foreground">Tendance</p>
                              <p className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                <span className="text-muted-foreground">Voir analyse</span>
                                <ArrowRight className="w-4 h-4" />
                              </p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <Button variant="outline" asChild className="w-full sm:w-auto">
                              <Link href={`/analyse?tab=products&type=${type.toLowerCase()}`}>
                                Voir le détail des {type.toLowerCase()}s
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : null}
          </section>

          {/* Section 4: Facteurs d'influence */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              Facteurs qui influencent les prix
            </h2>

            <p className="text-muted-foreground leading-relaxed mb-8">
              Plusieurs éléments peuvent faire varier significativement le prix d'un produit
              Pokémon scellé.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                {
                  title: "Popularité de l'extension",
                  description:
                    "Les séries avec des Pokémon iconiques (Dracaufeu, Pikachu) ou des artworks populaires sont plus demandées.",
                  icon: TrendingUp,
                  color: "text-primary",
                  bg: "bg-primary/10",
                },
                {
                  title: "Annonces de reprint",
                  description:
                    "Quand Asmodée annonce une réimpression, les prix du produit original peuvent chuter brutalement.",
                  icon: RefreshCw,
                  color: "text-orange-500",
                  bg: "bg-orange-500/10",
                },
                {
                  title: "Rareté et âge",
                  description:
                    "Plus un produit est ancien et rare, plus sa valeur tend à augmenter. Les stocks diminuent naturellement.",
                  icon: Clock,
                  color: "text-purple-500",
                  bg: "bg-purple-500/10",
                },
                {
                  title: "État général du marché",
                  description:
                    "Le marché suit des cycles. Périodes de hype (hausse générale) et corrections (baisse).",
                  icon: BarChart3,
                  color: "text-success",
                  bg: "bg-success/10",
                },
              ].map((factor, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2 rounded-lg shrink-0", factor.bg)}>
                        <factor.icon className={cn("w-5 h-5", factor.color)} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{factor.title}</h3>
                        <p className="text-sm text-muted-foreground">{factor.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Section 5: Limites des données */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7 text-warning shrink-0" />
              Limites des données
            </h2>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Pour une utilisation éclairée de nos données, il est important de comprendre leurs
              limites.
            </p>

            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Marché non régulé</h3>
                    <p className="text-sm text-muted-foreground">
                      Contrairement aux marchés boursiers, le marché des cartes Pokémon n'est pas
                      régulé. Les prix sont fixés librement par les vendeurs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Variations selon plateformes</h3>
                    <p className="text-sm text-muted-foreground">
                      Les prix peuvent varier significativement entre Cardmarket, eBay, Vinted et
                      LeBonCoin. Nous affichons le prix plancher observé.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Prix d'annonce vs prix de vente</h3>
                    <p className="text-sm text-muted-foreground">
                      Nos données reflètent les prix demandés, pas nécessairement les prix
                      auxquels les transactions ont lieu.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground">Délais de mise à jour</h3>
                    <p className="text-sm text-muted-foreground">
                      Bien que nous mettions à jour quotidiennement, un décalage de quelques heures
                      est possible par rapport aux prix temps réel.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* FAQ Section */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <HelpCircle className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              Questions fréquentes
            </h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="real-prices">
                <AccordionTrigger className="text-left">
                  Les prix affichés sont-ils des prix de vente réels ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Les prix affichés sont des prix planchers observés sur les principales plateformes
                  de vente (Cardmarket, eBay, Vinted, LeBonCoin). Il s'agit de prix d'annonces, pas
                  nécessairement de prix de transactions effectives. Cela donne une bonne indication
                  du prix minimum auquel vous pouvez espérer acheter un produit.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="update-frequency">
                <AccordionTrigger className="text-left">
                  À quelle fréquence les données sont-elles mises à jour ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Les données sont mises à jour quotidiennement par nos agents. Chaque jour, nous
                  scannons les principales plateformes pour récupérer les prix les plus récents.
                  L'heure de mise à jour peut varier, mais les données sont généralement fraîches de
                  moins de 24h.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="variations">
                <AccordionTrigger className="text-left">
                  Pourquoi certains produits varient fortement ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Les variations importantes peuvent être dues à plusieurs facteurs : annonce de
                  reprint par The Pokémon Company, sortie d'une nouvelle extension concurrente, effet
                  de hype sur les réseaux sociaux (YouTubeurs, TikTok), ou simplement une offre
                  exceptionnellement basse qui fait chuter le prix plancher temporairement.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="prediction">
                <AccordionTrigger className="text-left">
                  Peut-on prédire l'évolution future des prix Pokémon ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Non, personne ne peut prédire l'avenir avec certitude. Les données historiques
                  permettent d'identifier des tendances et des patterns, mais le marché reste
                  imprévisible. Les performances passées ne garantissent jamais les résultats
                  futurs. Utilisez ces données comme un outil d'aide à la décision, pas comme une
                  boule de cristal.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* CTA Section */}
          <section className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              Envie d'aller plus loin ?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Découvrez notre analyse complète sur la rentabilité de l'investissement Pokémon, ou
              explorez le détail par série sur notre page d'analyse.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/investir-pokemon">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Guide investissement
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/analyse">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analyse du marché
                </Link>
              </Button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <div className="border-t border-border/50 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Données mises à jour quotidiennement • Sources : Cardmarket, eBay, Vinted, LeBonCoin
              </p>
              <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
                <Link href="/methodologie">
                  En savoir plus sur notre méthodologie
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
