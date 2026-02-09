// app/page.tsx — Server Component
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

import HeroSection from "@/components/home/HeroSection";
import CTASection from "@/components/home/CTASection";
import { TrendingCarousel, HomeInsightsSection, FloatingGuidesBadge } from "@/components/home/ClientSections";

export default function HomePage() {
  return (
    <>
      {/* JSON-LD Schemas enrichis */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Pokéindex",
            url: "https://www.pokeindex.fr",
            logo: "https://www.pokeindex.fr/logo/logo_pki.png",
            description: "Observatoire indépendant des prix du marché Pokémon scellé francophone",
            foundingDate: "2024",
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer service",
              url: "https://www.pokeindex.fr/contact",
              availableLanguage: ["French", "English"],
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Pokéindex",
            description: "Comparateur de prix indépendant pour le marché secondaire Pokémon scellé. Agrège les données de Cardmarket, eBay, Vinted et LeBonCoin.",
            url: "https://www.pokeindex.fr",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            author: { "@type": "Organization", name: "Pokéindex" },
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "EUR",
              lowPrice: "0",
              highPrice: "87",
              offerCount: 2,
            },
            featureList: [
              "Comparaison de prix multi-plateformes",
              "Données Cardmarket, eBay, Vinted, LeBonCoin",
              "Analyse de tendances",
              "Alertes de prix",
              "Historique des prix",
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Pokéindex",
            url: "https://www.pokeindex.fr",
            description: "Observatoire des prix du marché Pokémon scellé",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://www.pokeindex.fr/rechercher?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />

      <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
        <HeroSection />

        {/* TRENDING */}
        <section className="py-16 sm:py-20" aria-labelledby="trending-title">
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <div className="text-center mb-8 sm:mb-12 space-y-3">
              <h2 id="trending-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Produits en{" "}
                <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  Tendance
                </span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Les produits avec les plus grandes variations de prix cette semaine (prix plancher observé la veille sur les marketplaces)
              </p>
            </div>

            <TrendingCarousel />

            <div className="text-center mt-8 sm:mt-10">
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base font-medium rounded-xl border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300">
                <Link href="/analyse">
                  Voir tous les produits
                  <Icons.zap className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <HomeInsightsSection />

        <CTASection />
      </div>

      <FloatingGuidesBadge />
    </>
  );
}
