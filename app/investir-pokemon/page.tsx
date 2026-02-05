import Link from "next/link";
import {
  TrendingUp,
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
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { ISPHeroWidget, ISPChartCard } from "@/components/investir/ISPWidget";
import { TableOfContents } from "@/components/investir/TableOfContents";
import { BentoGrid, BentoTile } from "@/components/investir/Bento";
import { ProductsBento } from "@/components/investir/ProductsBento";
import { RisksBento } from "@/components/investir/RisksBento";
import { MarketsByLanguageBento } from "@/components/investir/MarketsByLanguageBento";
import { GradingBento } from "@/components/investir/GradingBento";

export default function InvestirPokemonPage() {
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
                  text: "Oui, l'achat et la revente de cartes Pokémon sont légaux en France. En revanche, la fiscalité dépend de votre situation (vente occasionnelle vs activité habituelle) et des montants en jeu. En cas de doute, conservez vos preuves d'achat et renseignez-vous auprès des sources officielles (impots.gouv.fr) ou d'un conseiller fiscal.",
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
                  text: "Les prix sur Pokéindex sont mis à jour quotidiennement. Nous agrégeons les données de plusieurs plateformes (Cardmarket, eBay, Vinted, LeBonCoin) pour fournir une estimation du prix plancher actuel du marché francophone.",
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
        {/* Table of Contents */}
        <TableOfContents />

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

            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl sm:text-justify sm:hyphens-auto">
              L'investissement dans les cartes Pokémon attire de plus en plus de collectionneurs
              et d'investisseurs. Entre hausses spectaculaires et corrections brutales, il est
              parfois difficile de savoir si ce marché est réellement rentable. Cette page analyse
              l'évolution des prix des produits Pokémon scellés et les facteurs à prendre en compte
              avant d'investir.
            </p>

            {/* ISP-FR Mini Widget */}
            <div className="mt-6 sm:mt-8">
              <ISPHeroWidget />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12 sm:space-y-20">
          {/* Section 1: Le marché aujourd'hui */}
          <section id="marche">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <BarChart3 className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" aria-hidden="true" />
              Le marché des cartes Pokémon aujourd'hui
            </h2>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed sm:text-justify sm:hyphens-auto">
                Entre 2020 et 2021, le marché des cartes Pokémon a connu une expansion sans précédent.
                Les confinements successifs ont ravivé la nostalgie d'une génération ayant grandi avec
                la licence, tandis que l'exposition médiatique apportée par des créateurs de contenu
                français comme Michou a largement contribué à
                populariser le hobby auprès du grand public. Les ouvertures de produits anciens et les
                contenus spectaculaires ont joué un rôle clé dans cette mise en lumière, accélérant
                l'arrivée d'une nouvelle génération de collectionneurs et de créateurs spécialisés.
              </p>

              <p className="text-muted-foreground leading-relaxed mt-4 sm:text-justify sm:hyphens-auto">
                Après cette phase d'euphorie, le marché a connu une correction progressive, notamment
                avec l'arrivée du bloc Écarlate et Violet, marqué par une forte augmentation des volumes
                imprimés. Néanmoins, une partie des produits emblématiques de la période 2020–2021
                conserve une prime par rapport au prix retail d'origine, tandis que d'autres sont
                revenus vers des niveaux plus proches du marché primaire, surtout après des vagues de
                réassort. En parallèle, le marché secondaire s'est professionnalisé : des places de
                marché établies comme Cardmarket (actif depuis bien avant 2020), historiquement
                centrées sur les cartes à l'unité, ont vu le scellé prendre plus de place, et la
                transparence des prix s'est améliorée (données publiques, comparateurs, historique).
                Des outils d'analyse spécialisés comme
                <span className="font-semibold text-foreground"> Pokéindex </span>
                permettent désormais de suivre l'évolution des prix du marché français avec un niveau
                de granularité inédit.
              </p>
            </div>

            {/* Stats Cards */}
            <BentoGrid className="grid-cols-1 sm:grid-cols-3 mt-6 sm:mt-8">
              <BentoTile accent="primary">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 border border-border/40">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">2020-21</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Pic de la hype</p>
                  </div>
                </div>
              </BentoTile>

              <BentoTile accent="success">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10 border border-border/40">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-success" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">4+</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Plateformes agrégées</p>
                  </div>
                </div>
              </BentoTile>

              <BentoTile accent="purple">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-border/40">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">24h</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Mise à jour des prix</p>
                  </div>
                </div>
              </BentoTile>
            </BentoGrid>
          </section>

          {/* Section 2: Produits les plus rentables */}
          <section id="produits">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Package className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" aria-hidden="true" />
              Quels produits Pokémon sont les plus rentables ?
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 sm:mb-8">
              Tous les produits Pokémon ne se valent pas en termes d'investissement. Voici les
              principales catégories et leur potentiel de valorisation.
            </p>

            <ProductsBento />

            {/* Encart dynamique des séries - Forme en Y */}
            <div className="mt-8 p-5 sm:p-6 rounded-xl bg-muted/30 border border-border/50 overflow-hidden">
              <h3 className="font-semibold text-foreground text-sm mb-2 text-center">
                Deux dynamiques, deux trajectoires
              </h3>
              <p className="text-xs text-muted-foreground text-center mb-8">
                Le taux de drop influence le comportement des collectionneurs et la trajectoire des prix.
              </p>

              {/* Structure en Y */}
              <div className="relative min-h-[220px] sm:min-h-[240px]">
                {/* Le Y en "route" */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 400 240"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                >
                  {/* ROUTE = sous-couche "asphalte" */}
                  <path
                    d="M 200 210 C 200 160, 150 120, 90 78"
                    fill="none"
                    stroke="hsl(var(--background))"
                    strokeWidth="22"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  <path
                    d="M 200 210 C 200 160, 250 120, 310 78"
                    fill="none"
                    stroke="hsl(var(--background))"
                    strokeWidth="22"
                    strokeLinecap="round"
                    opacity="0.9"
                  />

                  {/* BORDS/COULEUR = couche colorée par-dessus (un peu plus fine) */}
                  <path
                    d="M 200 210 C 200 160, 150 120, 90 78"
                    fill="none"
                    stroke="url(#gradientEmerald)"
                    strokeWidth="16"
                    strokeLinecap="round"
                    opacity="0.95"
                  />
                  <path
                    d="M 200 210 C 200 160, 250 120, 310 78"
                    fill="none"
                    stroke="url(#gradientAmber)"
                    strokeWidth="16"
                    strokeLinecap="round"
                    opacity="0.95"
                  />

                  {/* MARQUAGE CENTRAL = ligne pointillée au milieu (route) */}
                  <path
                    d="M 200 210 C 200 160, 150 120, 90 78"
                    fill="none"
                    stroke="hsl(var(--muted-foreground))"
                    strokeOpacity="0.25"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6 10"
                  />
                  <path
                    d="M 200 210 C 200 160, 250 120, 310 78"
                    fill="none"
                    stroke="hsl(var(--muted-foreground))"
                    strokeOpacity="0.25"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="6 10"
                  />

                  {/* Point central */}
                  <circle cx="200" cy="210" r="9" fill="hsl(var(--muted-foreground))" opacity="0.14" />
                  <circle cx="200" cy="210" r="4.5" fill="hsl(var(--muted-foreground))" opacity="0.35" />

                  {/* Gradients */}
                  <defs>
                    <linearGradient id="gradientEmerald" x1="50%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0.85" />
                    </linearGradient>
                    <linearGradient id="gradientAmber" x1="50%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgb(245 158 11)" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="rgb(245 158 11)" stopOpacity="0.85" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Conteneur des séries */}
                <div className="relative flex justify-between items-start px-1 sm:px-8">
                  {/* Série gauche - Zénith Suprême */}
                  <div className="flex flex-col items-center text-center w-[120px] sm:w-[170px] sm:translate-x-6">
                    <div className="relative mb-2 sm:mb-3">
                      <div className="absolute inset-0 rounded-xl bg-emerald-500/25 blur-xl" />
                      <img
                        src="/series/CRZ.webp"
                        alt="Zénith Suprême"
                        className="relative w-12 h-12 sm:w-20 sm:h-20 object-contain"
                      />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground">Zénith Suprême</p>
                    <p className="text-[9px] sm:text-[10px] text-emerald-500 font-medium mt-0.5 mb-1 hidden sm:block">Drop généreux et accessible donc ouvertures massives</p>
                    <p className="text-[9px] sm:text-[10px] text-emerald-500 font-medium mt-0.5 mb-1 sm:hidden">Drop généreux</p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
                      <span className="hidden sm:inline">Croissance</span> <span className="text-foreground font-medium">Lente mais stable</span>
                    </p>
                  </div>

                  {/* Série droite - Évolution Céleste */}
                  <div className="flex flex-col items-center text-center w-[120px] sm:w-[170px] sm:-translate-x-6">
                    <div className="relative mb-2 sm:mb-3">
                      <div className="absolute inset-0 rounded-xl bg-amber-500/25 blur-xl" />
                      <img
                        src="/series/EVS.webp"
                        alt="Évolution Céleste"
                        className="relative w-12 h-12 sm:w-20 sm:h-20 object-contain"
                      />
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground">Évolution Céleste</p>
                    <p className="text-[9px] sm:text-[10px] text-amber-500 font-medium mt-0.5 mb-1 hidden sm:block">Drop rare donc stockage massif</p>
                    <p className="text-[9px] sm:text-[10px] text-amber-500 font-medium mt-0.5 mb-1 sm:hidden">Drop rare</p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed hidden sm:block">
                      Montée rapide mais subis souvent de fortes corrections. <span className="text-foreground font-medium">Fort potentiel à long terme</span>, plus volatile
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed sm:hidden">
                      <span className="text-foreground font-medium">Fort potentiel</span>, volatile
                    </p>
                  </div>
                </div>

                {/* Label point de départ */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                  <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">
                    Sortie
                  </span>
                </div>
              </div>
            </div>


            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">💡 Conseil :</span> Consultez notre{" "}
                <Link href="/historique-prix-pokemon" className="text-primary font-medium hover:underline">
                  historique des prix Pokémon scellés
                </Link>{" "}
                pour voir l'évolution des prix par type de produit.
              </p>
            </div>
          </section>

          {/* Section 3: Performances historiques */}
          <section id="performances">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" aria-hidden="true" />
              Analyse des performances historiques
            </h2>

            <p className="text-muted-foreground leading-relaxed mb-6">
              L'<span className="font-semibold text-foreground">ISP-FR</span> (Index du Scellé
              Pokémon FR) mesure l'évolution globale du marché français des produits scellés. Cet
              indice chaîné, similaire aux indices boursiers, permet de suivre la tendance générale.
            </p>

            {/* ISP Chart Card - Client Component */}
            <ISPChartCard />

            <div className="mt-6 p-4 rounded-xl bg-warning/10 border border-warning/30">
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-foreground">Avertissement :</span> Les
                  performances passées ne préjugent pas des performances futures. Le marché des
                  cartes Pokémon reste volatile et imprévisible.
                </span>
              </p>
            </div>
          </section>

          {/* Section 4: Risques */}
          <section id="risques">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7 text-destructive shrink-0" aria-hidden="true" />
              Les risques à connaître avant d'investir
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 sm:mb-8 sm:text-justify sm:hyphens-auto">
              Comme tout investissement, les cartes Pokémon comportent des risques qu'il est
              essentiel de comprendre avant de se lancer.
            </p>

            <RisksBento />
          </section>

          {/* Section 5: Marché FR vs EN */}
          <section id="fr-vs-en">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Scale className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" aria-hidden="true" />
              Marchés par langue : FR, EN, JP, KR, CN
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 sm:text-justify sm:hyphens-auto">
              En 2025-2026, une partie de la croissance se déplace aussi vers des marchés non-EN : JP
              (premium/collection), KR (niche opportuniste) et CN (traction en hausse). Plutôt que de
              chercher “la langue la plus rentable”, pense en{" "}
              <span className="font-semibold text-foreground">liquidité</span>,{" "}
              <span className="font-semibold text-foreground">prime scellé</span> et{" "}
              <span className="font-semibold text-foreground">coût d'import</span>.
            </p>

            <MarketsByLanguageBento />
          </section>

          {/* Section 6: Le grading */}
          <section id="grading">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Shield className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" aria-hidden="true" />
              Le grading : authentifier et valoriser
            </h2>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 sm:text-justify sm:hyphens-auto">
              Le grading (notation de l'état des cartes par des sociétés spécialisées) est devenu
              incontournable. Une carte gradée en excellent état peut valoir plusieurs fois le prix
              d'une carte non gradée.
            </p>

            <GradingBento />
          </section>

          {/* Section 7: Investissement vs Collection */}
          <section id="collection-vs-invest">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <Heart className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" aria-hidden="true" />
              Collection ou investissement ?
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
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" aria-hidden="true" />
                    Approche Collection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {[
                    "Plaisir personnel avant tout",
                    "Privilégie l'ouverture et les cartes",
                    "Attachement émotionnel aux produits",
                    "Vision long terme (5-10+ ans)",
                    "Moins de stress sur les fluctuations",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Investissement */}
              <Card className="border-2 border-purple-500/30">
                <CardHeader className="pb-2 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" aria-hidden="true" />
                    Approche Investissement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  {[
                    { text: "Objectif de rendement financier", positive: true },
                    { text: "N'achète que du 100% scellé", positive: true },
                    { text: "Analyse rationnelle des opportunités", positive: true },
                    { text: "Nécessite un suivi régulier", positive: false },
                    { text: "Plus exposé au stress du marché", positive: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                      {item.positive ? (
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" aria-hidden="true" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive shrink-0" aria-hidden="true" />
                      )}
                      <span>{item.text}</span>
                    </div>
                  ))}
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

          {/* Section 8: Conclusion */}
          <section id="conclusion">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <CheckCircle className="w-5 h-5 sm:w-7 sm:h-7 text-success shrink-0" aria-hidden="true" />
              Conclusion : bonne idée ?
            </h2>

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed sm:text-justify sm:hyphens-auto">
                Investir dans les cartes Pokémon peut être rentable, mais ce n'est{" "}
                <span className="font-semibold text-foreground">ni garanti, ni sans risque</span>.
                Le marché a montré de belles performances ces dernières années, mais il reste
                volatile et imprévisible.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Pour maximiser vos chances de succès :
              </p>
              <ul className="text-muted-foreground space-y-3 sm:space-y-2 mt-4 list-none pl-0">
                {[
                  { title: "Informez-vous", desc: "Suivez les tendances avec des outils comme Pokéindex" },
                  { title: "Diversifiez", desc: "Ne mettez pas tous vos oeufs dans le même panier" },
                  { title: "Pensez long terme", desc: "Les meilleurs gains se font sur 5-10 ans" },
                  { title: "Restez prudent", desc: "N'investissez que ce que vous pouvez perdre" },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success mt-0.5 shrink-0" aria-hidden="true" />
                    <span>
                      <span className="font-semibold text-foreground">{item.title}</span> — {item.desc}
                    </span>
                  </li>
                ))}
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
                    <BarChart3 className="w-4 h-4 mr-2" aria-hidden="true" />
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
          <section id="faq">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
              <HelpCircle className="w-5 h-5 sm:w-7 sm:h-7 text-primary shrink-0" aria-hidden="true" />
              Questions fréquentes
            </h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="legal">
                <AccordionTrigger className="text-left">
                  Est-ce légal d'investir dans les cartes Pokémon ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Oui, l'achat et la revente de cartes Pokémon sont légaux en France.{" "}
                  <span className="font-semibold text-foreground">Fiscalité :</span> elle dépend de
                  votre situation (vente occasionnelle vs activité habituelle) et des montants en
                  jeu. Par prudence, conservez vos preuves d'achat/vente et renseignez-vous auprès
                  des sources officielles (impots.gouv.fr) ou d'un conseiller fiscal.
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
                  À quelle fréquence les prix sont-ils mis à jour ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Les prix sur Pokéindex sont mis à jour quotidiennement. Nous agrégeons les données
                  de plusieurs plateformes (Cardmarket, eBay, Vinted, LeBonCoin) pour fournir une
                  estimation du prix plancher actuel du marché francophone.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="track">
                <AccordionTrigger className="text-left">
                  Comment suivre les prix en temps réel ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Pokéindex propose un{" "}
                  <Link href="/analyse" className="text-primary hover:underline">
                    tableau de bord gratuit
                  </Link>{" "}
                  avec l'ISP-FR (Index du Scellé Pokémon FR) qui mesure l'évolution globale du
                  marché. Vous pouvez consulter les tendances, les top performers et les analyses
                  détaillées.
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
                  Prêt à analyser le marché ?
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Explorez gratuitement nos outils d'analyse et de suivi des prix.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Button variant="outline" asChild className="w-full sm:w-auto">
                  <Link href="/analyse">Explorer les données</Link>
                </Button>
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/pricing">Voir les plans Pro</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
