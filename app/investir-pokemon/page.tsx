"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  BarChart3,
  Package,
  Clock,
  Coins,
  Scale,
  Heart,
  ChevronRight,
  CheckCircle,
  XCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { useAnalyseItems } from "@/hooks/useAnalyseItems";
import { computeISPFromItems } from "@/lib/analyse/finance/ispIndex";
import { cn } from "@/lib/utils";

export default function InvestirPokemonPage() {
  const { items, loading } = useAnalyseItems();

  const ispSummary = useMemo(() => {
    if (!items || items.length === 0) return null;
    return computeISPFromItems(items);
  }, [items]);

  const sparkValues = useMemo(() => {
    if (!ispSummary?.history || ispSummary.history.length === 0) return [];
    return ispSummary.history.slice(-60).map((p) => p.value);
  }, [ispSummary]);

  const formatPercent = (value: number | null) => {
    if (value === null) return "N/A";
    const formatted = (value * 100).toFixed(1);
    return value >= 0 ? `+${formatted}%` : `${formatted}%`;
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
            headline: "Investir dans les cartes Pokémon : est-ce rentable ?",
            description:
              "Analyse complète du marché des cartes Pokémon scellées : rentabilité, risques, produits les plus performants et conseils pour investir.",
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
              "@id": "https://www.pokeindex.fr/investir-pokemon",
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
                name: "Est-ce légal d'investir dans les cartes Pokémon ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Oui, l'achat et la revente de cartes Pokémon sont parfaitement légaux. Il s'agit d'un marché de collection comme l'art ou les timbres. Cependant, les plus-values importantes peuvent être soumises à imposition selon votre pays de résidence.",
                },
              },
              {
                "@type": "Question",
                name: "Combien faut-il investir pour commencer ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Il n'y a pas de montant minimum. Vous pouvez commencer avec un simple booster à 5€ ou un coffret à 50€. L'important est de diversifier et d'investir uniquement ce que vous pouvez vous permettre de perdre.",
                },
              },
              {
                "@type": "Question",
                name: "Les cartes Pokémon vont-elles encore prendre de la valeur ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Personne ne peut prédire l'avenir avec certitude. Historiquement, les produits scellés vintage ont tendance à s'apprécier avec le temps, mais le marché reste volatile. Les performances passées ne garantissent pas les résultats futurs.",
                },
              },
              {
                "@type": "Question",
                name: "À quelle fréquence les prix sont-ils mis à jour sur Pokéindex ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Les prix sur Pokéindex sont mis à jour quotidiennement par nos agents. Nous agrégeons les données de plusieurs plateformes (Cardmarket, eBay, Vinted, LeBonCoin) pour fournir avec précision le prix plancher actuel.",
                },
              },
              {
                "@type": "Question",
                name: "Comment suivre les prix des cartes Pokémon en temps réel ?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Pokéindex propose un tableau de bord gratuit avec l'ISP-FR (Index du Scellé Pokémon FR) qui mesure l'évolution globale du marché. Vous pouvez consulter les tendances, les top performers et les analyses détaillées sur notre page Analyse.",
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
                name: "Investir dans les cartes Pokémon",
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

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
              <Link href="/" className="hover:text-foreground transition">
                Accueil
              </Link>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-foreground">Investir dans les cartes Pokémon</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Investir dans les cartes Pokémon :{" "}
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                est-ce rentable ?
              </span>
            </h1>

            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
              L'investissement dans les cartes Pokémon attire de plus en plus de collectionneurs
              et d'investisseurs. Entre hausses spectaculaires et corrections brutales, il est
              parfois difficile de savoir si ce marché est réellement rentable. Cette page analyse
              l'évolution des prix des produits Pokémon scellés et les facteurs à prendre en compte
              avant d'investir.
            </p>

            {/* ISP-FR Mini Widget */}
            <div className="mt-6 sm:mt-8">
              {loading ? (
                <Skeleton className="h-24 w-full max-w-md rounded-xl" />
              ) : ispSummary ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 rounded-xl bg-card border border-border/50 shadow-sm">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">ISP-FR aujourd'hui</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
                        {ispSummary.current.toFixed(2)}
                      </p>
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          (ispSummary.change7d ?? 0) >= 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {formatPercent(ispSummary.change7d)} (7j)
                      </p>
                    </div>
                    <div className="w-24 sm:w-32 h-14 sm:h-16">
                      <Sparkline
                        values={sparkValues}
                        strokeClassName={
                          (ispSummary.change7d ?? 0) >= 0 ? "text-success" : "text-destructive"
                        }
                        withFill
                        height={56}
                      />
                    </div>
                  </div>
                  <Link
                    href="/analyse"
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    Voir l'analyse complète
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-16">
          {/* Section 1: Le marché aujourd'hui */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <BarChart3 className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              Le marché des cartes Pokémon aujourd'hui
            </h2>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Depuis 2020, le marché des cartes Pokémon a connu une croissance exceptionnelle.
                L'effet nostalgie, combiné à l'arrivée de nouveaux investisseurs attirés par les
                performances spectaculaires de certaines cartes, a transformé ce qui était un simple
                hobby en un véritable marché d'investissement alternatif.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Le marché secondaire s'est progressivement structuré avec l'émergence de plateformes
                spécialisées comme Cardmarket, et d'outils d'analyse comme{" "}
                <span className="font-semibold text-foreground">Pokéindex</span> qui permettent de
                suivre l'évolution des prix en temps réel. Cette professionnalisation attire aussi
                bien les collectionneurs passionnés que les investisseurs à la recherche de
                diversification.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
              <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <CardContent className="pt-4 sm:pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">2020</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Boom du marché</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-success/5 to-transparent border-success/20">
                <CardContent className="pt-4 sm:pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">4+</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Plateformes agrégées</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
                <CardContent className="pt-4 sm:pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">24h</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Mise à jour des prix</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 2: Produits les plus rentables */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Package className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              Quels produits Pokémon sont les plus rentables ?
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 sm:mb-8">
              Tous les produits Pokémon ne se valent pas en termes d'investissement. Voici les
              principales catégories et leur potentiel de valorisation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Boosters */}
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <span className="text-xl sm:text-2xl">📦</span>
                    Boosters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Les blisters ou boosters scellés sont le format le plus accessible. Leur valeur augmente
                    généralement avec le temps, surtout pour les séries populaires ou anciennes.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Accessible
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Liquidité élevée
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Displays */}
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <span className="text-xl sm:text-2xl">📚</span>
                    Displays (Boîtes de 36)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Les displays offrent généralement le meilleur rapport coût/booster. Leur format
                    scellé garantit l'authenticité et la conservation optimale.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Meilleur ratio
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Conservation
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Coffrets */}
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <span className="text-xl sm:text-2xl">🎁</span>
                    Coffrets & ETB
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Les coffrets Elite Trainer Box (ETB) et coffrets collection sont très recherchés
                    pour leur présentation premium et leur contenu exclusif (souvent carte promo).
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Premium
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Collectionneurs
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Éditions limitées */}
              <Card>
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <span className="text-xl sm:text-2xl">✨</span>
                    Éditions limitées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Les UPC (Ultra Premium Collection), coffrets anniversaire et produits exclusifs
                    ont le plus fort potentiel de valorisation mais aussi le plus de volatilité.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Haut potentiel
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Volatile
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">💡 Conseil :</span> Consultez notre{" "}
                <Link href="/historique-prix-pokemon" className="text-primary font-medium hover:underline">
                  historique des prix Pokémon scellés
                </Link>{" "}
                pour voir l'évolution des prix par type de produit, ou notre{" "}
                <Link href="/analyse" className="text-primary font-medium hover:underline">
                  page d'analyse du marché
                </Link>{" "}
                pour identifier les meilleures opportunités.
              </p>
            </div>
          </section>

          {/* Section 3: Performances historiques */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              Analyse des performances historiques
            </h2>

            <p className="text-muted-foreground leading-relaxed mb-6">
              L'<span className="font-semibold text-foreground">ISP-FR</span> (Index du Scellé
              Pokémon FR) mesure l'évolution globale du marché français des produits scellés. Cet
              indice chaîné, similaire aux indices boursiers, permet de suivre la tendance générale.
            </p>

            {/* ISP Chart Card */}
            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : ispSummary ? (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5 pb-3 sm:pb-6">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-base sm:text-lg">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      Évolution de l'ISP-FR
                    </span>
                    <Badge
                      variant={
                        (ispSummary.change30d ?? 0) >= 0 ? "success" : "destructive"
                      }
                      className="w-fit"
                    >
                      {formatPercent(ispSummary.change30d)} (30j)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="h-40 sm:h-48">
                    <Sparkline
                      values={ispSummary.history.map((p) => p.value)}
                      strokeClassName="text-blue-500"
                      withFill
                      height={160}
                    />
                  </div>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                    <div>
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
                    <div>
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
                    <div>
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
                    <div>
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

            <div className="mt-6 p-4 rounded-xl bg-warning/10 border border-warning/30">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                <span>
                  <span className="font-semibold text-foreground">Avertissement :</span> Les
                  performances passées ne préjugent pas des performances futures. Le marché des
                  cartes Pokémon reste volatile et imprévisible.
                </span>
              </p>
            </div>
          </section>

          {/* Section 4: Risques */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7 text-destructive shrink-0" />
              Les risques à connaître avant d'investir
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 sm:mb-8">
              Comme tout investissement, les cartes Pokémon comportent des risques qu'il est
              essentiel de comprendre avant de se lancer.
            </p>

            <div className="space-y-3 sm:space-y-4">
              {[
                {
                  icon: TrendingDown,
                  title: "Volatilité",
                  description:
                    "Les prix peuvent fluctuer fortement en quelques semaines. Une série très demandée peut perdre 30% de sa valeur après un reprint ou un changement de tendance.",
                  color: "text-destructive",
                  bg: "bg-destructive/10",
                },
                {
                  icon: Shield,
                  title: "Contrefaçons",
                  description:
                    "Le marché est touché par les faux produits. Privilégiez les vendeurs réputés et apprenez à authentifier les produits scellés.",
                  color: "text-orange-500",
                  bg: "bg-orange-500/10",
                },
                {
                  icon: Package,
                  title: "Reprints",
                  description:
                    "The Pokémon Company peut réimprimer des séries populaires, ce qui fait chuter la valeur des produits en circulation.",
                  color: "text-yellow-500",
                  bg: "bg-yellow-500/10",
                },
                {
                  icon: Clock,
                  title: "Stockage & Conservation",
                  description:
                    "Un produit mal conservé (humidité, lumière, chocs) perd énormément de valeur. Le stockage a un coût qu'il faut intégrer.",
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                },
                {
                  icon: Coins,
                  title: "Liquidité",
                  description:
                    "Vendre rapidement au prix souhaité n'est pas toujours possible. Certains produits peuvent mettre des semaines à trouver preneur.",
                  color: "text-purple-500",
                  bg: "bg-purple-500/10",
                },
                {
                  icon: TrendingUp,
                  title: "Effet de mode",
                  description:
                    "La hype autour de certaines séries peut créer des bulles spéculatives. Quand l'engouement retombe, les prix s'effondrent.",
                  color: "text-pink-500",
                  bg: "bg-pink-500/10",
                },
              ].map((risk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border/50 bg-card"
                >
                  <div className={cn("p-2 rounded-lg shrink-0", risk.bg)}>
                    <risk.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", risk.color)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">{risk.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">{risk.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5: Investissement vs Collection */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Scale className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              Pokémon : investissement ou collection ?
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 sm:mb-8">
              La frontière entre collection et investissement est souvent floue. Voici les
              différences clés pour vous aider à définir votre approche.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Collection */}
              <Card className="border-2 border-primary/30">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Approche Collection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
                    <span>Plaisir personnel avant tout</span>
                  </div>
                   <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
                    <span>Privilégie l'ouverture et les cartes</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
                    <span>Attachement émotionnel aux produits</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
                    <span>Vision long terme (5-10+ ans)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
                    <span>Moins de stress sur les fluctuations</span>
                  </div>
                </CardContent>
              </Card>

              {/* Investissement */}
              <Card className="border-2 border-purple-500/30">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                    Approche Investissement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
                    <span>Objectif de rendement financier</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
                    <span>Aucune ouverture, n'achète que du 100% scellé</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
                    <span>Analyse rationnelle des opportunités</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive shrink-0" />
                    <span>Nécessite un suivi régulier</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive shrink-0" />
                    <span>Plus exposé au stress du marché</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border/50">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Notre conseil :</span> La meilleure
                approche est souvent un mix des deux. Collectionnez ce que vous aimez vraiment, et
                si ces produits prennent de la valeur, c'est un bonus. Ne mettez jamais d'argent que
                vous ne pouvez pas vous permettre de perdre.
              </p>
            </div>
          </section>

          {/* Section 6: Conclusion */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-success shrink-0" />
              Conclusion : investir dans les cartes Pokémon, bonne idée ?
            </h2>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Investir dans les cartes Pokémon peut être rentable, mais ce n'est{" "}
                <span className="font-semibold text-foreground">ni garanti, ni sans risque</span>.
                Le marché a montré de belles performances ces dernières années, mais il reste
                volatile et imprévisible.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Pour maximiser vos chances de succès :
              </p>
              <ul className="text-muted-foreground space-y-3 sm:space-y-2 mt-4">
                <li className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success mt-0.5 shrink-0" />
                  <span>
                    <span className="font-semibold text-foreground">Informez-vous</span> — Suivez
                    les tendances avec des outils comme Pokéindex
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success mt-0.5 shrink-0" />
                  <span>
                    <span className="font-semibold text-foreground">Diversifiez</span> — Ne mettez
                    pas tous vos oeufs dans le même panier
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success mt-0.5 shrink-0" />
                  <span>
                    <span className="font-semibold text-foreground">Pensez long terme</span> — Les
                    meilleurs gains se font sur 5-10 ans
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs sm:text-sm">
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success mt-0.5 shrink-0" />
                  <span>
                    <span className="font-semibold text-foreground">Restez prudent</span> —
                    N'investissez que ce que vous pouvez perdre
                  </span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                Suivez le marché avec Pokéindex
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Accédez gratuitement à notre tableau de bord avec l'ISP-FR, les tendances par série
                et les analyses détaillées pour prendre des décisions éclairées.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/analyse">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Voir l'analyse du marché
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/recherche">Rechercher un produit</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <HelpCircle className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" />
              Questions fréquentes
            </h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="legal">
                <AccordionTrigger className="text-left">
                  Est-ce légal d'investir dans les cartes Pokémon ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Oui, l'achat et la revente de cartes Pokémon sont parfaitement légaux. Il s'agit
                  d'un marché de collection comme l'art ou les timbres. Cependant, les plus-values
                  importantes peuvent être soumises à imposition selon votre pays de résidence.
                  Consultez un conseiller fiscal si nécessaire.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="budget">
                <AccordionTrigger className="text-left">
                  Combien faut-il investir pour commencer ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Il n'y a pas de montant minimum. Vous pouvez commencer avec un simple booster à 5€
                  ou un coffret à 50€. L'important est de diversifier et d'investir uniquement ce
                  que vous pouvez vous permettre de perdre. Beaucoup commencent avec 100-500€ pour
                  tester le marché.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="future">
                <AccordionTrigger className="text-left">
                  Les cartes Pokémon vont-elles encore prendre de la valeur ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Personne ne peut prédire l'avenir avec certitude. Historiquement, les produits
                  scellés vintage ont tendance à s'apprécier avec le temps, mais le marché reste
                  volatile. Les performances passées ne garantissent pas les résultats futurs.
                  L'ISP-FR vous aide à suivre la tendance actuelle.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="update">
                <AccordionTrigger className="text-left">
                  À quelle fréquence les prix sont-ils mis à jour sur Pokéindex ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Les prix sur Pokéindex sont mis à jour quotidiennement. Nous agrégeons les données
                  de plusieurs plateformes (Cardmarket, eBay, Vinted, LeBonCoin) pour fournir une
                  estimation du prix plancher actuel du marché francophone.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="track">
                <AccordionTrigger className="text-left">
                  Comment suivre les prix des cartes Pokémon en temps réel ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Pokéindex propose un{" "}
                  <Link href="/analyse" className="text-primary hover:underline">
                    tableau de bord gratuit
                  </Link>{" "}
                  avec l'ISP-FR (Index du Scellé Pokémon FR) qui mesure l'évolution globale du
                  marché. Vous pouvez consulter les tendances, les top performers et les analyses
                  détaillées. Les membres Pro ont accès à des indicateurs avancés comme le sentiment
                  et la volatilité.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </main>

        {/* Footer CTA */}
        <div className="border-t border-border/50 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <p className="font-semibold text-foreground text-sm sm:text-base">
                  Prêt à suivre le marché Pokémon ?
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Créez un compte gratuit pour accéder à toutes les fonctionnalités.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/analyse">Explorer gratuitement</Link>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/pricing">Voir les plans</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
