"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { ProBadge } from "@/components/analyse/ProWidget";
import { useTutorial, type TutorialStep } from "@/components/tutorial";
import { useAuth } from "@/context/AuthContext";

const platforms = [
  { name: "eBay", icon: "🛒", color: "from-ebay to-ebay-soft", mobileColor: "bg-ebay-soft", ariaLabel: "eBay" },
  { name: "Cardmarket", icon: "🏪", color: "from-cardmarket to-cardmarket-soft", mobileColor: "bg-cardmarket-soft", ariaLabel: "Cardmarket" },
  { name: "LeBoncoin", icon: "📦", color: "from-leboncoin to-leboncoin-soft", mobileColor: "bg-leboncoin-soft", ariaLabel: "LeBonCoin" },
  { name: "Vinted", icon: "👕", color: "from-vinted to-vinted-soft", mobileColor: "bg-vinted-soft", ariaLabel: "Vinted" },
];

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const { startTutorial, hasCompleted } = useTutorial();
  const { user, loading: authLoading } = useAuth();

  // Check for reduced motion preference via CSS media query
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

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
  }, [mounted, hasCompleted, startTutorial, authLoading, user]);

  const animClass = prefersReducedMotion ? "hero-no-motion" : "hero-animated";

  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center overflow-hidden" aria-labelledby="hero-title">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" aria-hidden="true" />

      {!prefersReducedMotion && (
        <>
          <div className="absolute top-10 right-5 sm:top-20 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-3xl animate-hero-glow" aria-hidden="true" />
          <div className="absolute bottom-10 left-5 sm:bottom-20 sm:left-20 w-40 h-40 sm:w-80 sm:h-80 bg-purple-500/20 rounded-full blur-3xl animate-hero-glow" style={{ animationDelay: "1s" }} aria-hidden="true" />
        </>
      )}

      <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className={`space-y-6 sm:space-y-8 text-center lg:text-left ${animClass} hero-fade-in-up`}>
            <div
              className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm text-sm sm:text-base ${animClass} hero-fade-in-up`}
              style={{ animationDelay: "0.2s" }}
              role="status"
              aria-live="polite"
            >
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className={prefersReducedMotion ? "absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" : "animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"} />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs sm:text-sm font-semibold text-primary">
                Prix vérifiés par un humain · 100% Gratuit
              </span>
            </div>

            <div className="space-y-5 sm:space-y-7">
              <h1 id="hero-title" className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                <span className="block">Quel est le prix réel</span>
                <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  de votre scellé Pokémon ?
                </span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                On compare les prix sur Cardmarket, eBay, LeBonCoin et Vinted pour vous donner{" "}
                <span className="font-semibold text-foreground">le vrai prix plancher de chaque produit scellé</span>.
                Pas un algo, pas une estimation :{" "}
                <span className="font-semibold text-foreground">chaque prix est vérifié à la main</span>, annonce par annonce.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start" role="list" aria-label="Plateformes supportées">
              {platforms.map((platform, i) => (
                <div
                  key={platform.name}
                  role="listitem"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${platform.color} bg-opacity-10 border-white/10 backdrop-blur-sm hover:scale-105 transition-transform duration-300 ${animClass} hero-scale-in`}
                  style={{ animationDelay: `${0.4 + i * 0.1}s` }}
                  aria-label={platform.ariaLabel}
                >
                  <span className="text-lg" aria-hidden="true">{platform.icon}</span>
                  <span className="text-sm font-semibold text-foreground">{platform.name}</span>
                </div>
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
          </div>

          {mounted && (
            <div
              className={`relative hidden lg:block ${animClass} hero-fade-in-right`}
              style={{ animationDelay: "0.2s" }}
              aria-hidden="true"
            >
              <div className="relative w-full h-[500px] xl:h-[600px]">
                <div
                  className={`absolute inset-0 rounded-2xl xl:rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10
                    backdrop-blur-xl border border-border/50 shadow-2xl p-6 xl:p-8 ${prefersReducedMotion ? "" : "animate-hero-float"}`}
                >
                  <div className="w-full h-full rounded-xl xl:rounded-2xl bg-background/50 backdrop-blur-sm border border-border/30
                    flex flex-col items-center justify-center p-6 space-y-6">

                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Icons.search className="h-10 w-10 text-primary" strokeWidth={2} />
                    </div>

                    <div className="flex gap-4">
                      {platforms.map((platform, i) => (
                        <div
                          key={platform.name}
                          className={`
                            w-16 h-20 rounded-lg bg-gradient-to-br ${platform.color}
                            shadow-lg border dark:border-white/50 border-black/10 flex items-center justify-center text-2xl
                            ${prefersReducedMotion ? "" : "animate-hero-bob"}
                          `}
                          style={prefersReducedMotion ? {} : {
                            animationDuration: `${2 + i * 0.5}s`,
                            animationDelay: `${i * 0.3}s`
                          }}
                        >
                          {platform.icon}
                        </div>
                      ))}
                    </div>

                    <div className="w-full space-y-2">
                      {[60, 85, 45].map((width, i) => (
                        <div
                          key={i}
                          className={`h-2 rounded-full bg-gradient-to-r from-primary/30 to-purple-500/30 ${prefersReducedMotion ? "" : "animate-hero-bar"}`}
                          style={{
                            width: `${width}%`,
                            animationDelay: `${1 + i * 0.2}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute -left-4 xl:-left-8 top-1/4 px-4 xl:px-6 py-3 xl:py-4 rounded-xl xl:rounded-2xl
                    bg-background/90 backdrop-blur-xl border border-border/50 shadow-xl
                    ${prefersReducedMotion ? "" : "animate-hero-slide-right"}`}
                >
                  <div className="flex items-center gap-2 xl:gap-3">
                    <span className="text-2xl" aria-hidden="true">🏪</span>
                    <div>
                      <p className="text-xl xl:text-2xl font-bold">€24.99</p>
                      <p className="text-[10px] xl:text-xs text-muted-foreground">Cardmarket</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`absolute -right-4 xl:-right-8 bottom-1/4 px-4 xl:px-6 py-3 xl:py-4 rounded-xl xl:rounded-2xl
                    bg-background/90 backdrop-blur-xl border border-border/50 shadow-xl
                    ${prefersReducedMotion ? "" : "animate-hero-slide-left"}`}
                >
                  <div className="flex items-center gap-2 xl:gap-3">
                    <Icons.linechart className="h-5 xl:h-6 w-5 xl:w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                    <div>
                      <p className="text-xl xl:text-2xl font-bold text-green-600 dark:text-green-400">+18%</p>
                      <p className="text-[10px] xl:text-xs text-muted-foreground">30 jours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
  );
}
