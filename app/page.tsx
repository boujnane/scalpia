// app/page.tsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";

import { ProBadge } from "@/components/analyse/ProWidget";
import { useTutorial, type TutorialStep } from "@/components/tutorial";
import { useAuth } from "@/context/AuthContext";

const TrendingCarousel = dynamic(() => import("@/components/home/TrendingCarousel"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-border/50 bg-background/60 p-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl hidden lg:block" />
      </div>
    </div>
  ),
});

const HomeInsightsSection = dynamic(() => import("@/components/home/HomeInsightsSection"), {
  ssr: false,
  loading: () => (
    <section className="py-16 sm:py-20 border-t border-border/50 bg-muted/10">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </section>
  ),
});

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const { startTutorial, hasCompleted } = useTutorial();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (authLoading || !user) return;
    if (hasCompleted("home")) return;

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

    const desktopSteps: TutorialStep[] = [
      {
        id: "nav-logo",
        target: "[data-tutorial='nav-logo']",
        title: "Logo & Accueil",
        description: "Cliquez ici pour revenir à la page d'accueil à tout moment.",
        position: "bottom",
      },
      {
        id: "nav-links",
        target: "[data-tutorial='nav-links']",
        title: "Navigation principale",
        description: "Accédez rapidement aux pages clés : Recherche, Analyse, Cartes, Collection.",
        position: "bottom",
      },
      {
        id: "nav-search",
        target: "[data-tutorial='nav-search']",
        title: "Recherche rapide",
        description: "Ouvrez la recherche instantanée depuis la barre de navigation.",
        position: "bottom",
      },
      {
        id: "nav-tokens",
        target: "[data-tutorial='nav-tokens']",
        title: "Jetons",
        description: "Suivez vos jetons disponibles pour certaines fonctionnalités.",
        position: "bottom",
      },
      {
        id: "nav-theme",
        target: "[data-tutorial='nav-theme']",
        title: "Thème",
        description: "Basculez entre clair et sombre.",
        position: "bottom",
      },
      {
        id: "nav-user",
        target: "[data-tutorial='nav-user']",
        title: "Compte",
        description: "Accédez à votre profil, paramètres et déconnexion.",
        position: "bottom",
      },
    ];

    const mobileSteps: TutorialStep[] = [
      {
        id: "nav-logo",
        target: "[data-tutorial='nav-logo']",
        title: "Logo & Accueil",
        description: "Touchez ici pour revenir à l'accueil.",
        position: "bottom",
      },
      {
        id: "nav-menu",
        target: "[data-tutorial='nav-menu']",
        title: "Menu",
        description: "Ouvrez le menu pour accéder à toutes les sections.",
        position: "bottom",
      },
      {
        id: "nav-search",
        target: "[data-tutorial='nav-search']",
        title: "Recherche rapide",
        description: "Lancez une recherche instantanée depuis l'icône.",
        position: "bottom",
      },
      {
        id: "nav-tokens",
        target: "[data-tutorial='nav-tokens']",
        title: "Jetons",
        description: "Vos jetons disponibles sont visibles ici.",
        position: "bottom",
      },
    ];

    const steps = isDesktop ? desktopSteps : mobileSteps;

    const timer = setTimeout(() => {
      startTutorial(steps, "home");
    }, 400);

    return () => clearTimeout(timer);
  }, [mounted, hasCompleted, startTutorial]);

  const platforms = [
    { name: "eBay", icon: "🛒", color: "from-ebay to-ebay-soft", mobileColor: "bg-ebay-soft", ariaLabel: "eBay" },
    { name: "Cardmarket", icon: "🏪", color: "from-cardmarket to-cardmarket-soft", mobileColor: "bg-cardmarket-soft", ariaLabel: "Cardmarket" },
    { name: "LeBoncoin", icon: "📦", color: "from-leboncoin to-leboncoin-soft", mobileColor: "bg-leboncoin-soft", ariaLabel: "LeBonCoin" },
    { name: "Vinted", icon: "👕", color: "from-vinted to-vinted-soft", mobileColor: "bg-vinted-soft", ariaLabel: "Vinted" },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 50 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.8 },
  };


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
        {/* HERO (je te laisse ton style, version compacte ici) */}
        <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center overflow-hidden" aria-labelledby="hero-title">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" aria-hidden="true" />

          {!prefersReducedMotion && (
            <>
              <div className="absolute top-10 right-5 sm:top-20 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
              <div className="absolute bottom-10 left-5 sm:bottom-20 sm:left-20 w-40 h-40 sm:w-80 sm:h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} aria-hidden="true" />
            </>
          )}

          <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <motion.div className="space-y-6 sm:space-y-8 text-center lg:text-left" {...fadeInUp}>
                <motion.div
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm text-sm sm:text-base"
                  role="status"
                  aria-live="polite"
                >
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className={prefersReducedMotion ? "absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" : "animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"} />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-primary">
                    100% Gratuit · Index des prix Pokémon
                  </span>
                </motion.div>

                <div className="space-y-5 sm:space-y-7">
                  <h1 id="hero-title" className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                    <span className="block">Maîtrisez le marché</span>
                    <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      secondaire Pokémon
                    </span>
                  </h1>

                  <p className="text-base sm:text-lg lg:text-xl text-muted-foreground/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    Accédez gratuitement à un{" "}
                    <span className="font-semibold text-foreground">index des prix du marché secondaire Pokémon</span>.
                    Nous analysons Cardmarket, LeBonCoin, eBay et Vinted pour trouver les prix planchers.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start" role="list" aria-label="Plateformes supportées">
                  {platforms.map((platform, i) => (
                    <motion.div
                      key={platform.name}
                      role="listitem"
                      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: prefersReducedMotion ? 0 : 0.4 + i * 0.1 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${platform.color} bg-opacity-10 border-white/10 backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
                      aria-label={platform.ariaLabel}
                    >
                      <span className="text-lg" aria-hidden="true">{platform.icon}</span>
                      <span className="text-sm font-semibold text-foreground">{platform.name}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start pt-2">
                  <Button asChild size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 hover:scale-105 w-full sm:w-auto group">
                    <Link href="/cartes">
                      <span className="hidden sm:inline">Rechercher une carte ou une série</span>
                      <span className="sm:hidden">Rechercher</span>
                      <Icons.search className="ml-2 h-4 sm:h-5 w-4 sm:w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-xl border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 hover:scale-105 w-full sm:w-auto group">
                    <Link href="/analyse">
                      <span className="hidden sm:inline">Analyser les produits scellés</span>
                      <span className="sm:hidden">Analyser</span>
                      <Icons.zap className="ml-2 h-4 sm:h-5 w-4 sm:w-5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>

                <div className="pt-4 flex justify-center lg:justify-start">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 backdrop-blur px-3 py-2">
                    <ProBadge />
                    <p className="text-xs text-muted-foreground">
                      Sentiment, volatilité, risque : lecture instantanée du marché
                    </p>
                    <Link href="/pricing" className="text-xs font-semibold text-primary hover:underline">
                      Voir Pro
                    </Link>
                  </div>
                </div>
              </motion.div>

{mounted && (
                <motion.div 
                  className="relative hidden lg:block"
                  initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.2 }}
                  aria-hidden="true"
                >
                  <div className="relative w-full h-[500px] xl:h-[600px]">
                    <motion.div
                      className="absolute inset-0 rounded-2xl xl:rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10 
                        backdrop-blur-xl border border-border/50 shadow-2xl p-6 xl:p-8"
                      animate={prefersReducedMotion ? {} : { y: [0, -20, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="w-full h-full rounded-xl xl:rounded-2xl bg-background/50 backdrop-blur-sm border border-border/30 
                        flex flex-col items-center justify-center p-6 space-y-6">
                        
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Icons.search className="h-10 w-10 text-primary" strokeWidth={2} />
                        </div>

                        <div className="flex gap-4">
                          {platforms.map((platform, i) => (
                            <motion.div
                              key={platform.name}
                              className={`
                                w-16 h-20 rounded-lg bg-gradient-to-br ${platform.color}
                                shadow-lg border dark:border-white/50 border-black/10 flex items-center justify-center text-2xl
                              `}
                              animate={prefersReducedMotion ? {} : { 
                                y: [0, -10, 0],
                                rotate: [0, 5 - i * 5, 0]
                              }}
                              transition={{ 
                                duration: 2 + i * 0.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.3
                              }}
                            >
                              {platform.icon}
                            </motion.div>
                          ))}
                        </div>

                        <div className="w-full space-y-2">
                          {[60, 85, 45].map((width, i) => (
                            <motion.div
                              key={i}
                              className="h-2 rounded-full bg-gradient-to-r from-primary/30 to-purple-500/30"
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={prefersReducedMotion ? { duration: 0 } : { 
                                duration: 1.5,
                                delay: 1 + i * 0.2,
                                repeat: Infinity,
                                repeatDelay: 2
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="absolute -left-4 xl:-left-8 top-1/4 px-4 xl:px-6 py-3 xl:py-4 rounded-xl xl:rounded-2xl 
                        bg-background/90 backdrop-blur-xl border border-border/50 shadow-xl"
                      animate={prefersReducedMotion ? {} : { x: [0, 10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div className="flex items-center gap-2 xl:gap-3">
                        <span className="text-2xl" aria-hidden="true">🏪</span>
                        <div>
                          <p className="text-xl xl:text-2xl font-bold">€24.99</p>
                          <p className="text-[10px] xl:text-xs text-muted-foreground">Cardmarket</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="absolute -right-4 xl:-right-8 bottom-1/4 px-4 xl:px-6 py-3 xl:py-4 rounded-xl xl:rounded-2xl 
                        bg-background/90 backdrop-blur-xl border border-border/50 shadow-xl"
                      animate={prefersReducedMotion ? {} : { x: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    >
                      <div className="flex items-center gap-2 xl:gap-3">
                        <Icons.linechart className="h-5 xl:h-6 w-5 xl:w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                        <div>
                          <p className="text-xl xl:text-2xl font-bold text-green-600 dark:text-green-400">+18%</p>
                          <p className="text-[10px] xl:text-xs text-muted-foreground">30 jours</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-center mt-8 lg:hidden" aria-hidden="true">
                <div className="relative w-48 h-60 rounded-xl bg-background shadow-lg p-4 border border-border/50">
                  <div className="w-full h-full rounded-lg bg-background flex flex-col items-center justify-center p-4 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Icons.search className="h-5 w-5 text-primary" strokeWidth={2} />
                    </div>
                    <div className="flex gap-2">
                      {platforms.map((platform) => (
                        <div key={platform.name} className={`w-8 h-8 rounded-full flex items-center justify-center ${platform.mobileColor}`}>
                          <span className="text-base">{platform.icon}</span>
                        </div>
                      ))}
                    </div>
                    <div className="w-full space-y-1 mt-2">
                      <div className="h-1.5 w-[60%] rounded-full bg-blue-500" />
                      <div className="h-1.5 w-[85%] rounded-full bg-yellow-500" />
                      <div className="h-1.5 w-[45%] rounded-full bg-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRENDING */}
        <section className="py-16 sm:py-20" aria-labelledby="trending-title">
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <motion.div
              className="text-center mb-8 sm:mb-12 space-y-3"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 id="trending-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Produits en{" "}
                <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  Tendance
                </span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Les items avec les plus grandes variations de prix cette semaine (Prix le plus bas observé sur une des marketplaces aujourd’hui)
              </p>
            </motion.div>

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

        {/* CTA */}
        <section className="relative py-20 sm:py-28 lg:py-32 overflow-hidden" aria-labelledby="cta-title">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" aria-hidden="true" />
          <motion.div
            className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="max-w-4xl mx-auto text-center space-y-8 py-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-secondary text-secondary-foreground backdrop-blur-sm">
                <Icons.refreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-sm font-medium">Index mis à jour quotidiennement</span>
              </div>

              <h2 id="cta-title" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight px-4">
                L&apos;observatoire des prix du
                <span className="block mt-2 text-primary">marché Pokémon scellé</span>
                francophone
              </h2>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
                Accédez à un index consolidé des prix planchers observés sur les principales marketplaces.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 px-4">
                <Button asChild size="lg" className="h-12 px-8 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all">
                  <Link href="/analyse">
                    <Icons.barChart3 className="mr-2 h-5 w-5" aria-hidden="true" />
                    Consulter l&apos;index des prix
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base font-medium rounded-lg">
                  <Link href="/pricing">Voir le plan Pro</Link>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground/60 pt-4">
                Données agrégées à titre indicatif. Nous ne sommes pas affiliés aux plateformes citées.
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
}
