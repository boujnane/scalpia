"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Item } from "@/lib/analyse/types";
import { groupByBloc } from "@/lib/analyse/groupByBloc";
import { blocImages } from "@/lib/analyse/blocImages";
import BlocChart from "./BlocCharts";
import ItemsGrid from "./ItemsGrid";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Icons } from "../icons";

type BlocTabsProps = {
  items?: Item[];
};

function safeDateMs(d?: string) {
  const t = d ? Date.parse(d) : NaN;
  return Number.isFinite(t) ? t : 0;
}

// Petit helper pour normaliser un id DOM safe
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BlocTabs({ items }: BlocTabsProps) {
  const safeItems = items ?? [];

  const sortedItems = useMemo(() => {
    return [...safeItems].sort(
      (a, b) => safeDateMs(b.releaseDate) - safeDateMs(a.releaseDate)
    );
  }, [safeItems]);

  const sortedBlocs = useMemo(() => {
    const blocs = groupByBloc(sortedItems);

    return Object.entries(blocs).sort((a, b) => {
      const aMax = Math.max(...a[1].map((i) => safeDateMs(i.releaseDate)));
      const bMax = Math.max(...b[1].map((i) => safeDateMs(i.releaseDate)));
      return bMax - aMax;
    });
  }, [sortedItems]);

  const defaultBloc = sortedBlocs[0]?.[0] ?? "";

  const [activeBloc, setActiveBloc] = useState(defaultBloc);

  // Refs pour auto-scroll le bouton actif
  const dockRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!activeBloc && defaultBloc) setActiveBloc(defaultBloc);
    if (activeBloc && !sortedBlocs.some(([b]) => b === activeBloc)) {
      setActiveBloc(defaultBloc);
    }
  }, [activeBloc, defaultBloc, sortedBlocs]);

  // Auto scroll du bouton actif dans la zone visible
  useEffect(() => {
    const btn = buttonRefs.current[activeBloc];
    const container = dockRef.current;
    if (!btn || !container) return;

    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();

    // Si le bouton actif est hors champ, on le recentre
    const outLeft = bRect.left < cRect.left + 12;
    const outRight = bRect.right > cRect.right - 12;

    if (outLeft || outRight) {
      btn.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeBloc]);

  if (sortedBlocs.length === 0) {
    return <div className="p-6 text-muted-foreground">Aucun item disponible.</div>;
  }

  const activeItems =
    sortedBlocs.find(([bloc]) => bloc === activeBloc)?.[1] ?? [];

  return (
    <div className="space-y-6">
      {/* --- DOCK D'IMAGES (custom, pas de TabsList/Trigger visible) --- */}
{/* --- DOCK D'IMAGES (responsive + fades corrects) --- */}
<div className="relative">
  {/* Conteneur “surface” du dock : utile pour que les fades prennent la bonne couleur */}
  <div className="relative rounded-3xl bg-card/30 border border-border/40 backdrop-blur-sm">
    
    {/* Fades : ils utilisent la même couleur que le dock (pas background global) */}
    <div className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-14 md:w-16 rounded-l-3xl bg-gradient-to-r from-card/90 via-card/60 to-transparent z-10" />
    <div className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-14 md:w-16 rounded-r-3xl bg-gradient-to-l from-card/90 via-card/60 to-transparent z-10" />

    <div
      ref={dockRef}
      className="
        flex items-center gap-3 sm:gap-4
        overflow-x-auto
        px-3 sm:px-4 md:px-6
        py-3 sm:py-4
        scroll-smooth
        snap-x snap-mandatory
        [-ms-overflow-style:none]
        [scrollbar-width:none]
        [&::-webkit-scrollbar]:hidden
        overscroll-x-contain
        touch-pan-x
      "
      // petit confort mobile: inertie iOS
      style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
    >
      {sortedBlocs.map(([bloc]) => {
        const isActive = bloc === activeBloc;
        const img = blocImages[bloc] ?? "/default.png";

        return (
          <button
            key={bloc}
            ref={(el) => {
              buttonRefs.current[bloc] = el;
            }}
            type="button"
            aria-label={`Ouvrir le bloc ${bloc}`}
            aria-current={isActive ? "true" : undefined}
            onClick={() => setActiveBloc(bloc)}
            className={`
              snap-center
              shrink-0
              rounded-2xl
              outline-none
              transition-transform duration-200
              ${isActive ? "-translate-y-0.5" : "translate-y-0"}
              focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card
            `}
          >
            <div
              className={`
                relative
                flex items-center justify-center
                rounded-2xl
                border
                transition-all duration-200
                bg-background/30
                ${
                  isActive
                    ? "border-primary/45 shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_14px_40px_-22px_rgba(59,130,246,0.6)]"
                    : "border-border/50 hover:border-border/80 hover:bg-background/40 hover:shadow-sm"
                }

                /* tailles responsive : plus large desktop, plus lisible mobile */
                h-14 w-[96px]
                sm:h-16 sm:w-[110px]
                md:h-16 md:w-[120px]
                lg:h-18 lg:w-[132px]
              `}
            >
              {/* glow actif */}
              {isActive && (
                <div className="absolute -inset-3 -z-10 rounded-[28px] bg-primary/10 blur-xl" />
              )}

              <img
                src={img}
                alt={`Logo du bloc ${bloc}`}
                loading="lazy"
                decoding="async"
                className={`
                  object-contain transition-transform duration-200
                  h-10 sm:h-11 md:h-11 lg:h-12
                  ${isActive ? "scale-[1.07]" : "scale-100"}
                `}
              />

              {/* indicator (plus visible desktop) */}
              <div
                className={`
                  absolute -bottom-1 left-1/2 -translate-x-1/2
                  h-[3px] rounded-full transition-all duration-200
                  w-10 sm:w-12 md:w-14
                  ${isActive ? "bg-primary opacity-100" : "bg-transparent opacity-0"}
                `}
              />
            </div>
          </button>
        );
      })}
    </div>
  </div>

  {/* Hint mobile : “glisse” (optionnel mais UX ++). Cache sur desktop */}
  <div className="mt-2 text-xs text-muted-foreground sm:hidden px-2">
    Astuce : fais glisser horizontalement pour voir tous les blocs →
  </div>
</div>


      {/* --- TABS CONTENT (rendu d’un seul contenu) --- */}
      <Tabs value={activeBloc} onValueChange={setActiveBloc} className="bg-transparent">
        <TabsContent value={activeBloc} className="space-y-6 px-4 sm:px-0">
          {activeItems.length === 0 ? (
            <div className="p-4 text-muted-foreground">Aucun item dans ce bloc.</div>
          ) : (
            <>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem
                  value="bloc-chart"
                  className="
                    border border-border/60
                    rounded-2xl
                    bg-card/70
                    shadow-sm
                    overflow-hidden
                  "
                >
                  <AccordionTrigger
                    className="
                      px-5 py-4
                      text-base sm:text-lg font-semibold text-foreground
                      hover:no-underline
                      flex items-center justify-between
                      [&>svg]:transition-transform
                      data-[state=open]:[&>svg]:rotate-180
                    "
                  >
                    <span className="flex items-center gap-2">
                      <Icons.LineChart className="w-5 h-5 text-primary" />
                      Historique des variations de prix
                    </span>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4 pt-0">
                    <div className="rounded-xl border border-border/50 bg-background/40 p-3 sm:p-4">
                      <BlocChart items={activeItems} />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <ItemsGrid items={activeItems} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
