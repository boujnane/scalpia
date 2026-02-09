"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export default function CTASection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById("cta-section");
    if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="cta-section" className="relative py-20 sm:py-28 lg:py-32 overflow-hidden" aria-labelledby="cta-title">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" aria-hidden="true" />
      <div
        className={`container mx-auto px-4 sm:px-6 md:px-8 relative z-10 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        style={{ willChange: "transform, opacity" }}
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
      </div>
    </section>
  );
}
