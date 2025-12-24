"use client";

import { useEffect, useMemo, useState } from "react";
import type { CMCard, GradedPrices } from "@/lib/cardmarket/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Euro, Sparkles, BadgeCheck, TrendingUp, Layers, X } from "lucide-react";

/* =======================
   Helpers
======================= */

function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * Spotlight graded = meilleur indicateur "1 chip" (UX).
 * Priorité:
 *  - PSA10
 *  - CGC10
 *  - BGS10
 *  - sinon max de toutes les graded
 */
export function pickGradedSpotlight(
  graded?: GradedPrices
): { label: string; value: number } | null {
  if (!graded) return null;

  const pick = (prefix: string, obj?: Record<string, number>, key?: string) => {
    if (!obj) return null;
    if (key && isNum(obj[key])) return { label: `${prefix}${key.toUpperCase()}`, value: obj[key] };
    return null;
  };

  const psa10 = pick(" ", graded.psa, "psa10");
  if (psa10) return psa10;

  const cgc10 = pick(" ", graded.cgc, "cgc10");
  if (cgc10) return cgc10;

  const bgs10 = pick(" ", graded.bgs, "bgs10");
  if (bgs10) return bgs10;

  const all: Array<{ label: string; value: number }> = [];
  const pushAll = (prefix: string, obj?: Record<string, number>) => {
    if (!obj) return;
    for (const [k, v] of Object.entries(obj)) {
      if (isNum(v)) all.push({ label: `${prefix}${k.toUpperCase()}`, value: v });
    }
  };

  pushAll("PSA ", graded.psa);
  pushAll("CGC ", graded.cgc);
  pushAll("BGS ", graded.bgs);

  if (!all.length) return null;
  all.sort((a, b) => b.value - a.value);
  return all[0];
}

function gradedSummary(graded?: GradedPrices) {
  const summaryOne = (brand: "PSA" | "CGC" | "BGS", obj?: Record<string, number>) => {
    if (!obj) return { brand, max: null as number | null, count: 0 };
    const vals = Object.values(obj).filter(isNum);
    return { brand, max: vals.length ? Math.max(...vals) : null, count: vals.length };
  };

  return [
    summaryOne("PSA", graded?.psa),
    summaryOne("CGC", graded?.cgc),
    summaryOne("BGS", graded?.bgs),
  ];
}

function bestSignalPrice(card: CMCard): { value: number; label: "GRADED" | "FR" | "AVG7" } | null {
  const g = pickGradedSpotlight(card.prices?.graded);
  if (g) return { value: g.value, label: "GRADED" };
  if (isNum(card.prices?.fr)) return { value: card.prices.fr, label: "FR" };
  if (isNum(card.prices?.avg7)) return { value: card.prices.avg7, label: "AVG7" };
  return null;
}

/**
 * Desktop detector
 */
function useIsDesktop(breakpointPx = 1024) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const handler = () => setIsDesktop(mql.matches);
    handler();
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, [breakpointPx]);

  return isDesktop;
}

/* =======================
   Component
======================= */

export function SetFinancePanel(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  setName?: string;
  setLogo?: string;
  cards: CMCard[];
}) {
  const { open, onOpenChange, setName, setLogo, cards } = props;
  const isDesktop = useIsDesktop(1024);

  const finance = useMemo(() => {
    const byFR = cards
      .map((c) => ({ c, fr: isNum(c.prices?.fr) ? c.prices!.fr! : null }))
      .filter((x) => x.fr != null) as { c: CMCard; fr: number }[];

    const byAvg7 = cards
      .map((c) => ({ c, avg7: isNum(c.prices?.avg7) ? c.prices!.avg7! : null }))
      .filter((x) => x.avg7 != null) as { c: CMCard; avg7: number }[];

    const gradedCards = cards.filter((c) => !!pickGradedSpotlight(c.prices?.graded));

    const totalFR = byFR.reduce((acc, x) => acc + x.fr, 0);
    const avgFR = byFR.length ? totalFR / byFR.length : 0;

    const totalAvg7 = byAvg7.reduce((acc, x) => acc + x.avg7, 0);
    const avgAvg7 = byAvg7.length ? totalAvg7 / byAvg7.length : 0;

    const top10 = cards
      .map((c) => ({ c, sig: bestSignalPrice(c) }))
      .filter((x) => x.sig != null) as Array<{ c: CMCard; sig: { value: number; label: "GRADED" | "FR" | "AVG7" } }>;

    top10.sort((a, b) => b.sig.value - a.sig.value);

    return {
      count: cards.length,
      frCount: byFR.length,
      avg7Count: byAvg7.length,
      gradedCount: gradedCards.length,
      totalFR,
      avgFR,
      totalAvg7,
      avgAvg7,
      missingFR: Math.max(0, cards.length - byFR.length),
      top10: top10.slice(0, 10),
    };
  }, [cards]);

  const side = isDesktop ? "right" : "bottom";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side as any}
        className={[
          "p-0 overflow-hidden",
          side === "right" ? "w-[420px] xl:w-[460px] max-w-[92vw]" : "h-[86vh] rounded-t-2xl",
        ].join(" ")}
      >
        <div className="sticky top-0 z-10 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <SheetHeader className="p-4 pb-3">
            <div className="flex items-center gap-3">
              {setLogo ? (
                <div className="h-11 w-11 rounded-xl border bg-card flex items-center justify-center overflow-hidden">
                  <img src={setLogo} alt="" className="h-9 w-9 object-contain" />
                </div>
              ) : (
                <div className="h-11 w-11 rounded-xl border bg-muted/40 flex items-center justify-center">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <SheetTitle className="text-base sm:text-lg truncate">Finance — {setName ?? "Set"}</SheetTitle>
                <SheetDescription className="text-xs sm:text-sm">Valeur, couverture, graded, top cartes.</SheetDescription>
              </div>

              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="shrink-0" aria-label="Fermer">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </SheetHeader>

          <div className="px-4 pb-3">
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid grid-cols-2 w-full bg-muted/60">
                <TabsTrigger value="summary" className="data-[state=active]:bg-background">
                  Synthèse
                </TabsTrigger>
                <TabsTrigger value="top" className="data-[state=active]:bg-background">
                  Top 10
                </TabsTrigger>
              </TabsList>

              <ScrollArea className={side === "right" ? "h-[calc(100vh-168px)]" : "h-[calc(86vh-168px)]"}>
                <div className="p-4 space-y-4">
                  <TabsContent value="summary" className="m-0 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border bg-card p-3.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Euro className="h-4 w-4" />
                          Valeur estimée (FR)
                        </div>
                        <div className="mt-2 text-xl font-extrabold tabular-nums">{eur(finance.totalFR)}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {finance.frCount}/{finance.count} cartes pricées
                        </div>
                      </div>

                      <div className="rounded-2xl border bg-card p-3.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          Moyenne / carte (FR)
                        </div>
                        <div className="mt-2 text-xl font-extrabold tabular-nums">{finance.frCount ? eur(finance.avgFR) : "—"}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {finance.missingFR ? `${finance.missingFR} sans prix FR` : "Couverture complète"}
                        </div>
                      </div>

                      <div className="rounded-2xl border bg-card p-3.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Sparkles className="h-4 w-4" />
                          Valeur (Avg7)
                        </div>
                        <div className="mt-2 text-xl font-extrabold tabular-nums">{eur(finance.totalAvg7)}</div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {finance.avg7Count}/{finance.count} cartes avec avg7
                        </div>
                      </div>

                      <div className="rounded-2xl border bg-card p-3.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <BadgeCheck className="h-4 w-4" />
                          Couverture graded
                        </div>
                        <div className="mt-2 text-xl font-extrabold tabular-nums">
                          {finance.count ? `${Math.round((finance.gradedCount / finance.count) * 100)}%` : "—"}
                        </div>
                        <div className="mt-1 text-[11px] text-muted-foreground">
                          {finance.gradedCount}/{finance.count} cartes avec graded
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="rounded-2xl border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Indicateurs graded</p>
                        <Badge variant="secondary" className="text-[11px]">
                          signal = max graded
                        </Badge>
                      </div>
                      <div className="mt-3">
                        {finance.gradedCount === 0 ? (
                          <p className="text-sm text-muted-foreground">Aucune donnée graded détectée sur ce set.</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Spotlight = PSA10/CGC10/BGS10 (priorité), sinon le max graded de la carte.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-muted/30 p-4">
                      <p className="text-sm font-semibold">Notes</p>
                      <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                        <li>• “Valeur FR” = somme des meilleurs prix Cardmarket FR disponibles.</li>
                        <li>• “Avg7” = moyenne 7 jours (quand présente), utile pour lisser la volatilité.</li>
                        <li>• “Top 10” = tri par meilleur signal (graded &gt; FR &gt; avg7).</li>
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="top" className="m-0 space-y-2">
                    {finance.top10.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-8 text-center">Pas assez de données de prix pour établir un top.</div>
                    ) : (
                      finance.top10.map((x, idx) => {
                        const spotlight = pickGradedSpotlight(x.c.prices?.graded);
                        const gsum = gradedSummary(x.c.prices?.graded);

                        return (
                          <div key={x.c.id} className="rounded-2xl border bg-card p-3 flex items-center gap-3">
                            <div className="w-7 text-center text-xs font-mono text-muted-foreground">{idx + 1}</div>

                            <div className="h-11 w-11 rounded-xl bg-muted/40 overflow-hidden border flex items-center justify-center shrink-0">
                              {x.c.image ? <img src={x.c.image} alt="" className="h-full w-full object-contain" /> : <span className="text-lg">🃏</span>}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate">{x.c.name}</p>

                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {x.c.rarity ? <Badge variant="secondary" className="text-[10px] px-2">{x.c.rarity}</Badge> : null}
                                <Badge variant="outline" className="text-[10px] px-2 font-mono">#{x.c.card_number ?? "—"}</Badge>

                                {spotlight ? (
                                  <Badge variant="outline" className="text-[10px] px-2 font-mono tabular-nums">
                                    {spotlight.label.replace(" ", "")} {Math.round(spotlight.value)}€
                                  </Badge>
                                ) : null}
                              </div>

                              {spotlight ? (
                                <div className="mt-1 text-[11px] text-muted-foreground flex flex-wrap gap-2">
                                  {gsum.filter((g) => g.count > 0).map((g) => (
                                    <span key={g.brand} className="font-mono tabular-nums">
                                      {g.brand}: {g.max ? `${Math.round(g.max)}€` : "—"}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-extrabold tabular-nums">{eur(x.sig.value)}</p>
                              <p className="text-[11px] text-muted-foreground">{x.sig.label === "GRADED" ? "Graded" : x.sig.label}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </TabsContent>
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-background">
                <Button variant="secondary" className="w-full rounded-xl" onClick={() => onOpenChange(false)}>
                  Fermer
                </Button>
              </div>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
