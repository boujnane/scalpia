"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { CMCard, GradedPrices } from "@/lib/cardmarket/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

import {
  Layers,
  X,
  Search,
  ArrowDownAZ,
  ArrowUpAZ,
  Sparkles,
  TrendingUp,
  Percent,
  DollarSign,
} from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";

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

function bestFrPrice(card: CMCard): { value: number; label: "FR" } | null {
  if (isNum(card.prices?.fr)) return { value: card.prices.fr, label: "FR" };
  return null;
}

function quantile(sorted: number[], q: number) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

type HistogramBin = { label: string; count: number; pct: number };
type PriceBand = { label: string; count: number; pct: number };
type TopCard = { c: CMCard; sig: { value: number; label: "FR" } };

type FinanceData = {
  count: number;
  frCount: number;
  avg7Count: number;
  gradedCount: number;

  totalFR: number;
  avgFR: number;
  medianFR: number | null;
  p90FR: number | null;
  p95FR: number | null;
  minFR: number | null;
  maxFR: number | null;
  stdFR: number;
  cvFR: number;

  totalAvg7: number;
  avgAvg7: number;

  histogramBins: HistogramBin[];
  histMaxCount: number;

  cdfValues: number[];

  priceBands: PriceBand[];

  top5Share: number;
  top10Share: number;
  top2Share: number;
  top5SharePct: number;
  top10SharePct: number;
  top2SharePct: number;

  cardsTo70: number;
  cardsTo80: number;
  cardsTo90: number;

  top10: TopCard[];
  topMax: number;

  missingFR: number;
  coveragePercent: number;

  concentrationLabel: string;
  concentrationNote: string;

  priceCurve: number[];
};

function sampleValues(values: number[], target = 120) {
  if (values.length <= target) return values;
  const step = (values.length - 1) / (target - 1);
  return Array.from({ length: target }, (_, i) => values[Math.round(i * step)]);
}

function scalePareto(values: number[], mode: "contrast" | "sqrt" | "log" = "contrast") {
  if (!values.length) return [];
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v / 100));
  if (mode === "contrast") {
    const gamma = 1.5;
    return values.map((v) => Math.pow(clamp01(v), gamma) * 100);
  }
  if (mode === "log") {
    const k = 5;
    return values.map((v) => (Math.log1p(k * clamp01(v)) / Math.log1p(k)) * 100);
  }
  return values.map((v) => Math.sqrt(clamp01(v)) * 100);
}

function useSetFinance(cards: CMCard[]): FinanceData {
  return useMemo(() => {
    const byFR = cards
      .map((c) => ({ c, fr: isNum(c.prices?.fr) ? c.prices!.fr! : null }))
      .filter((x) => x.fr != null) as { c: CMCard; fr: number }[];

    const byAvg7 = cards
      .map((c) => ({ c, avg7: isNum(c.prices?.avg7) ? c.prices!.avg7! : null }))
      .filter((x) => x.avg7 != null) as { c: CMCard; avg7: number }[];

    const gradedCards = cards.filter((c) => !!pickGradedSpotlight(c.prices?.graded));

    const frValues = byFR.map((x) => x.fr).sort((a, b) => a - b);
    const frValuesDesc = [...frValues].sort((a, b) => b - a);

    const totalFR = frValues.reduce((acc, v) => acc + v, 0);
    const avgFR = frValues.length ? totalFR / frValues.length : 0;
    const medianFR = quantile(frValues, 0.5);
    const p90FR = quantile(frValues, 0.9);
    const p95FR = quantile(frValues, 0.95);
    const minFR = frValues.length ? frValues[0] : null;
    const maxFR = frValues.length ? frValues[frValues.length - 1] : null;

    const stdFR = frValues.length
      ? Math.sqrt(frValues.reduce((acc, v) => acc + Math.pow(v - avgFR, 2), 0) / frValues.length)
      : 0;
    const cvFR = avgFR ? stdFR / avgFR : 0;

    const totalAvg7 = byAvg7.reduce((acc, x) => acc + x.avg7, 0);
    const avgAvg7 = byAvg7.length ? totalAvg7 / byAvg7.length : 0;

    const q25 = quantile(frValues, 0.25);
    const q75 = quantile(frValues, 0.75);

    const histogramBins: HistogramBin[] = (() => {
      if (!frValues.length) return [];
      const min = frValues[0];
      const max = frValues[frValues.length - 1];
      if (min === max) {
        return [{ label: `${eur(min)} – ${eur(max)}`, count: frValues.length, pct: 100 }];
      }
      const iqr = q75 != null && q25 != null ? q75 - q25 : null;
      const binWidth = iqr && iqr > 0 ? (2 * iqr) / Math.cbrt(frValues.length) : null;
      const proposed = binWidth ? Math.ceil((max - min) / binWidth) : 6;
      const binCount = Math.max(5, Math.min(11, proposed || 6));
      const step = (max - min) / binCount || 1;

      const bins = Array.from({ length: binCount }, (_, i) => ({
        min: min + step * i,
        max: i === binCount - 1 ? max : min + step * (i + 1),
        count: 0,
      }));

      for (const v of frValues) {
        const idx = Math.min(bins.length - 1, Math.floor((v - min) / step));
        bins[idx].count += 1;
      }

      return bins.map((b) => ({
        label: `${eur(b.min)} – ${eur(b.max)}`,
        count: b.count,
        pct: frValues.length ? Math.round((b.count / frValues.length) * 100) : 0,
      }));
    })();

    const histMaxCount = Math.max(...histogramBins.map((b) => b.count), 1);

    const cdfValues = (() => {
      if (!frValuesDesc.length || totalFR === 0) return [];
      let acc = 0;
      return frValuesDesc.map((v) => {
        acc += v;
        return Math.round((acc / totalFR) * 100);
      });
    })();

    const priceBands: PriceBand[] = (() => {
      if (!frValues.length || medianFR == null || q75 == null || p90FR == null) return [];
      const bands = [
        { label: `≤ P50 (${eur(medianFR)})`, min: -Infinity, max: medianFR, count: 0 },
        { label: `P50–P75 (${eur(medianFR)}–${eur(q75)})`, min: medianFR, max: q75, count: 0 },
        { label: `P75–P90 (${eur(q75)}–${eur(p90FR)})`, min: q75, max: p90FR, count: 0 },
        { label: `> P90 (${eur(p90FR)})`, min: p90FR, max: Infinity, count: 0 },
      ];

      for (const v of frValues) {
        const band = bands.find((b) => v > b.min && v <= b.max);
        if (band) band.count += 1;
      }

      return bands.map((b) => ({
        ...b,
        pct: frValues.length ? Math.round((b.count / frValues.length) * 100) : 0,
      }));
    })();

    const top10 = cards
      .map((c) => ({ c, sig: bestFrPrice(c) }))
      .filter((x) => x.sig != null) as TopCard[];
    top10.sort((a, b) => b.sig.value - a.sig.value);
    const top10Slice = top10.slice(0, 10);
    const topMax = Math.max(...top10Slice.map((x) => x.sig.value), 1);

    const top5Share = totalFR
      ? top10Slice.slice(0, 5).reduce((acc, x) => acc + x.sig.value, 0) / totalFR
      : 0;
    const top10Share = totalFR
      ? top10Slice.reduce((acc, x) => acc + x.sig.value, 0) / totalFR
      : 0;
    const top2Share = totalFR
      ? top10Slice.slice(0, 2).reduce((acc, x) => acc + x.sig.value, 0) / totalFR
      : 0;

    const top5SharePct = totalFR ? Math.round(top5Share * 100) : 0;
    const top10SharePct = totalFR ? Math.round(top10Share * 100) : 0;
    const top2SharePct = totalFR ? Math.round(top2Share * 100) : 0;

    const cardsToShare = (target: number) => {
      if (!frValuesDesc.length || totalFR === 0) return 0;
      let acc = 0;
      for (let i = 0; i < frValuesDesc.length; i += 1) {
        acc += frValuesDesc[i];
        if (acc / totalFR >= target) return i + 1;
      }
      return frValuesDesc.length;
    };
    const cardsTo70 = cardsToShare(0.7);
    const cardsTo80 = cardsToShare(0.8);
    const cardsTo90 = cardsToShare(0.9);

    const concentrationLabel =
      cardsTo70 <= 3
        ? "Ultra concentré"
        : cardsTo70 <= 7
        ? "Concentré"
        : cardsTo70 <= 15
        ? "Modéré"
        : "Réparti";
    const concentrationNote =
      `70% captés par ${cardsTo70} carte${cardsTo70 > 1 ? "s" : ""} · 90% en ${cardsTo90} carte${
        cardsTo90 > 1 ? "s" : ""
      }.`;

    const missingFR = Math.max(0, cards.length - byFR.length);
    const coveragePercent = cards.length ? Math.round((byFR.length / cards.length) * 100) : 0;

    const priceCurve = sampleValues(
      frValues.map((v) => Math.sqrt(v)),
      140
    );

    return {
      count: cards.length,
      frCount: byFR.length,
      avg7Count: byAvg7.length,
      gradedCount: gradedCards.length,

      totalFR,
      avgFR,
      medianFR,
      p90FR,
      p95FR,
      minFR,
      maxFR,
      stdFR,
      cvFR,

      totalAvg7,
      avgAvg7,

      histogramBins,
      histMaxCount,

      cdfValues,

      priceBands,

      top5Share,
      top10Share,
      top2Share,
      top5SharePct,
      top10SharePct,
      top2SharePct,
      cardsTo70,
      cardsTo80,
      cardsTo90,

      top10: top10Slice,
      topMax,

      missingFR,
      coveragePercent,

      concentrationLabel,
      concentrationNote,

      priceCurve,
    };
  }, [cards]);
}

/* =======================
   UI Bits
======================= */

function CardShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border bg-card/80 shadow-sm",
        "ring-1 ring-border/40",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function CardHeaderRow({
  title,
  right,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="px-4 pt-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  );
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pb-4 pt-3">{children}</div>;
}

function Kpi({
  label,
  value,
  hint,
  icon,
  locked,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  locked?: boolean;
}) {
  return (
    <div className="rounded-xl bg-muted/30 p-3 ring-1 ring-border/40">
      <div className="flex items-center gap-2">
        {icon ? (
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-background/70 ring-1 ring-border/40">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {locked ? "—" : value}
          </p>
        </div>
        {locked ? (
          <Badge variant="secondary" className="ml-auto text-xs">
            Pro
          </Badge>
        ) : null}
      </div>
      {hint ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {locked ? (
            <span className="inline-flex items-center gap-2">
              <span>Insight Pro verrouillé</span>
              <Button asChild variant="secondary" size="sm" className="h-7 rounded-lg">
                <Link href="/pricing">Débloquer</Link>
              </Button>
            </span>
          ) : (
            hint
          )}
        </p>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/20 p-3 ring-1 ring-border/30">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm sm:text-base font-semibold tabular-nums whitespace-nowrap truncate">
        {value}
      </p>
    </div>
  );
}

function ChartBox({
  title,
  meta,
  children,
  footer,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  footer?: string;
}) {
  return (
    <div className="rounded-2xl border bg-background/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
      </div>
      <div className="mt-3">{children}</div>
      {footer ? <p className="mt-2 text-xs text-muted-foreground">{footer}</p> : null}
    </div>
  );
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

type TopSort = "price_desc" | "price_asc" | "name_asc" | "name_desc";

export function SetFinancePanel(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  setName?: string;
  setLogo?: string;
  cards: CMCard[];
  onSelectCard?: (card: CMCard) => void;
}) {
  const { open, onOpenChange, setName, setLogo, cards, onSelectCard } = props;
  const isDesktop = useIsDesktop(1024);
  const { isPro } = useAuth();

  const finance = useSetFinance(cards);
  const cdfDisplay = useMemo(() => {
    if (!finance.cdfValues.length) return [];
    return scalePareto([0, ...finance.cdfValues, 100], "contrast");
  }, [finance.cdfValues]);

  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);
  const handleTopCardSelect = useCallback(
    (card: CMCard) => {
      onSelectCard?.(card);
      onOpenChange(false);
    },
    [onSelectCard, onOpenChange]
  );
  const mockTopCards = useMemo(
    () => [
      { name: "Carte Alpha", rarity: "Ultra Rare", number: "001", price: "199,00 €", share: "12%" },
      { name: "Carte Beta", rarity: "Rare Holo", number: "045", price: "149,00 €", share: "9%" },
      { name: "Carte Gamma", rarity: "Secret", number: "102", price: "129,00 €", share: "8%" },
    ],
    []
  );

  const side = isDesktop ? "right" : "bottom";

  // Top10 UX: search + sort + keyboard focus restore
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<TopSort>("price_desc");
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) lastActiveRef.current = document.activeElement as HTMLElement | null;
    else lastActiveRef.current?.focus?.();
  }, [open]);

  useEffect(() => {
    setQ("");
    setSort("price_desc");
  }, [setName]);

  const filteredTop = useMemo(() => {
    const items = [...finance.top10];
    const needle = q.trim().toLowerCase();

    const filtered = needle
      ? items.filter((x) => (x.c.name ?? "").toLowerCase().includes(needle))
      : items;

    filtered.sort((a, b) => {
      if (sort === "price_desc") return b.sig.value - a.sig.value;
      if (sort === "price_asc") return a.sig.value - b.sig.value;
      if (sort === "name_asc") return (a.c.name ?? "").localeCompare(b.c.name ?? "");
      return (b.c.name ?? "").localeCompare(a.c.name ?? "");
    });

    return filtered;
  }, [finance.top10, q, sort]);

  const bandGradients = [
    "bg-gradient-to-r from-emerald-400/90 to-emerald-600/90",
    "bg-gradient-to-r from-sky-400/90 to-sky-600/90",
    "bg-gradient-to-r from-indigo-400/90 to-indigo-600/90",
    "bg-gradient-to-r from-amber-400/90 to-amber-600/90",
    "bg-gradient-to-r from-rose-400/90 to-rose-600/90",
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side as any}
        className={[
          "p-0 overflow-hidden",
          side === "right" ? "w-[520px] max-w-[96vw]" : "h-[86vh] rounded-t-2xl",
        ].join(" ")}
      >
        <Tabs defaultValue="summary" className="flex h-full w-full flex-col">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SheetHeader className="p-4 pb-3">
              <div className="flex items-center gap-3">
                {setLogo ? (
                  <div className="h-11 w-11 rounded-xl border bg-card flex items-center justify-center overflow-hidden">
                    <img src={setLogo} alt={`${setName ?? "Set"} logo`} className="h-9 w-9 object-contain" />
                  </div>
                ) : (
                  <div className="h-11 w-11 rounded-xl border bg-muted/40 flex items-center justify-center">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-base sm:text-lg truncate">Observatoire — {setName ?? "Set"}</SheetTitle>
                  <SheetDescription className="text-xs sm:text-sm">
                    Vue claire, focus sur la valeur, la couverture et la concentration.
                  </SheetDescription>
                </div>

                <Button variant="ghost" size="icon" onClick={handleClose} className="shrink-0" aria-label="Fermer">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </SheetHeader>

            <div className="px-4 pb-3">
              <TabsList className="grid w-full bg-muted/60 grid-cols-3">
                <TabsTrigger value="summary" className="data-[state=active]:bg-background">
                  Synthèse
                </TabsTrigger>
                <TabsTrigger
                  value="analysis"
                  className="data-[state=active]:bg-background data-[disabled]:opacity-60 data-[disabled]:pointer-events-none"
                  disabled={!isPro}
                >
                  Analyse
                  {!isPro && (
                    <span className="ml-2 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-semibold">
                      Pro
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="top" className="data-[state=active]:bg-background">
                  Top 10
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Body */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 pl-7 pr-4 space-y-4">
              {/* ===== Summary ===== */}
              <TabsContent value="summary" className="m-0 space-y-4">
                    <CardShell>
                      <CardHeaderRow
                        title="Indicateurs clés"
                        subtitle="Trois chiffres, lecture immédiate."
                        right={<Badge variant="secondary" className="text-[11px]">KPI</Badge>}
                      />
                      <CardBody>
                        <div className="flex flex-col gap-3">
                          <Kpi
                            label="Valeur totale"
                            value={eur(finance.totalFR)}
                            hint={`${finance.frCount}/${finance.count} cartes pricées`}
                            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                          />
                          <Kpi
                            label="Couverture FR"
                            value={finance.count ? `${finance.coveragePercent}%` : "—"}
                            hint={finance.missingFR ? `${finance.missingFR} sans prix` : "Couverture complète"}
                            icon={<Percent className="h-4 w-4 text-muted-foreground" />}
                          />
                          <Kpi
                            label="Concentration"
                            value={`${finance.top10SharePct}%`}
                            hint={`Top 10 • Top 5 ${finance.top5SharePct}%`}
                            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
                            locked={!isPro}
                          />
                        </div>
                      </CardBody>
                    </CardShell>

                    <CardShell>
                      <CardHeaderRow
                        title="À retenir"
                        subtitle="Lecture rapide de la concentration et détails avancés."
                        right={
                          <Badge variant="secondary" className="text-[11px]">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Insight
                          </Badge>
                        }
                      />
                      <CardBody>
                        {isPro ? (
                          <div className="rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/20">
                            <p className="text-lg font-semibold">{finance.concentrationLabel}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{finance.concentrationNote}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {finance.medianFR != null ? (
                                <Badge variant="outline" className="text-[11px]">
                                  Médiane {eur(finance.medianFR)}
                                </Badge>
                              ) : null}
                              {finance.p90FR != null ? (
                                <Badge variant="outline" className="text-[11px]">
                                  P90 {eur(finance.p90FR)}
                                </Badge>
                              ) : null}
                              {finance.cvFR ? (
                                <Badge variant="outline" className="text-[11px]">
                                  CV {(finance.cvFR * 100).toFixed(1)}%
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="relative overflow-hidden rounded-xl bg-primary/5 p-4 ring-1 ring-primary/20">
                              <div className="pointer-events-none blur-[2px] opacity-70">
                                <p className="text-lg font-semibold">Concentration du set</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Une poignée de cartes concentre une part significative de la valeur.
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    Médiane 7,40 €
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    P90 29,80 €
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    CV 180%
                                  </Badge>
                                </div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="rounded-xl bg-background/90 px-3 py-2 text-center ring-1 ring-border/40">
                                  <p className="text-xs font-semibold">Insights Pro</p>
                                  <Button asChild variant="secondary" className="mt-2 w-full rounded-lg">
                                    <Link href="/pricing">Devenir Pro</Link>
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="relative overflow-hidden rounded-xl bg-muted/20 p-4 ring-1 ring-border/30">
                              <div className="pointer-events-none blur-[2px] opacity-70 space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-semibold">Aperçu Analyse Pro</p>
                                  <Badge variant="secondary" className="text-[11px]">Analyse</Badge>
                                </div>
                                <div className="space-y-2">
                                  {[65, 42, 78, 30].map((w, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <div className="w-20 text-[11px] text-muted-foreground">Tranche</div>
                                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-primary/60" style={{ width: `${w}%` }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="rounded-lg border bg-background/60 p-2 text-center text-[11px]">
                                    P90 ~ 28€
                                  </div>
                                  <div className="rounded-lg border bg-background/60 p-2 text-center text-[11px]">
                                    Top10 ~ 55%
                                  </div>
                                  <div className="rounded-lg border bg-background/60 p-2 text-center text-[11px]">
                                    CV ~ 200%
                                  </div>
                                </div>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="rounded-xl bg-background/90 px-3 py-2 text-center ring-1 ring-border/40">
                                  <p className="text-xs font-semibold">Analyses Pro</p>
                                  <Button asChild variant="secondary" className="mt-2 w-full rounded-lg">
                                    <Link href="/pricing">Devenir Pro</Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardBody>
                    </CardShell>
                  </TabsContent>

                  {/* ===== Analysis ===== */}
                  {isPro ? (
                    <TabsContent value="analysis" className="m-0 space-y-4">
                      <CardShell>
                        <CardHeaderRow title="Distribution" subtitle="Comprendre les niveaux de prix." right={<Badge variant="secondary" className="text-[11px]">FR</Badge>} />
                        <CardBody>
                          {finance.frCount === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucun prix FR disponible.</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                              <MiniStat label="Min" value={finance.minFR != null ? eur(finance.minFR) : "—"} />
                              <MiniStat label="Max" value={finance.maxFR != null ? eur(finance.maxFR) : "—"} />
                              <MiniStat label="P90" value={finance.p90FR != null ? eur(finance.p90FR) : "—"} />
                              <MiniStat label="P95" value={finance.p95FR != null ? eur(finance.p95FR) : "—"} />
                              <MiniStat label="Écart-type" value={finance.frCount ? eur(finance.stdFR) : "—"} />
                              <MiniStat label="CV" value={finance.frCount ? `${(finance.cvFR * 100).toFixed(1)}%` : "—"} />
                            </div>
                          )}

                          <div className="mt-4 space-y-4">
                            <ChartBox
                              title="Histogramme"
                              meta={finance.histogramBins.length ? `${finance.histogramBins.length} classes` : "—"}
                              footer="Barres = densité par tranche de prix."
                            >
                              {finance.histogramBins.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Aucune donnée pour l’histogramme.</p>
                              ) : (
                                <div className="space-y-2">
                                  {finance.histogramBins.map((bin) => {
                                    const width = Math.round((bin.count / finance.histMaxCount) * 100);
                                    return (
                                      <div key={bin.label} className="flex items-center gap-2">
                                        <div className="w-32 text-xs text-muted-foreground truncate">{bin.label}</div>
                                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-sky-400/70 via-indigo-400/70 to-violet-400/70"
                                            style={{ width: `${width}%` }}
                                          />
                                        </div>
                                        <div className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                                          {bin.count}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </ChartBox>

                            <ChartBox title="Bandes de prix" meta="quantiles" footer="Segmentation en 4 zones (P50, P75, P90).">
                              {finance.priceBands.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Données insuffisantes.</p>
                              ) : (
                                <div className="space-y-2">
                                  {finance.priceBands.map((b, idx) => (
                                    <div key={b.label} className="rounded-xl border bg-background/70 p-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">{b.label}</span>
                                        <span className="text-xs font-semibold tabular-nums">
                                          {b.count} • {b.pct}%
                                        </span>
                                      </div>
                                      <div className="mt-2 h-2.5 rounded-full bg-muted overflow-hidden">
                                        <div
                                          className={`h-full rounded-full ${bandGradients[idx % bandGradients.length]}`}
                                          style={{ width: `${b.pct}%` }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </ChartBox>
                          </div>
                        </CardBody>
                      </CardShell>

                      <CardShell>
                        <CardHeaderRow title="Concentration" subtitle="Qui capte la valeur du set ?" right={<Badge variant="secondary" className="text-[11px]">Valeur</Badge>} />
                        <CardBody>
                          <ChartBox
                            title="CDF cumulée (Pareto)"
                            meta={finance.cdfValues.length ? `${finance.cdfValues.length} points · échelle contrastée` : "—"}
                            footer={`70% en ${finance.cardsTo70} carte${finance.cardsTo70 > 1 ? "s" : ""} · 90% en ${finance.cardsTo90} carte${finance.cardsTo90 > 1 ? "s" : ""}.`}
                          >
                            {cdfDisplay.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Aucune donnée pour la CDF.</p>
                            ) : (
                              <div className="rounded-xl border border-border/60 bg-muted/30 px-2 py-2">
                                <Sparkline
                                  values={cdfDisplay}
                                  height={96}
                                  strokeClassName="text-emerald-600"
                                  withFill
                                  strokeWidth={2.4}
                                  animated={false}
                                  showEndDot={false}
                                  padding={4}
                                />
                              </div>
                            )}
                          </ChartBox>

                          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <MiniStat label="Top 2" value={`${finance.top2SharePct}%`} />
                            <MiniStat label="Top 5" value={`${finance.top5SharePct}%`} />
                            <MiniStat label="Top 10" value={`${finance.top10SharePct}%`} />
                          </div>

                          <div className="mt-4 rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/20">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">{finance.concentrationLabel}</p>
                              <Badge variant="secondary" className="text-[11px]">Insight</Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{finance.concentrationNote}</p>
                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                              <MiniStat label="70% captés" value={`${finance.cardsTo70} cartes`} />
                              <MiniStat label="80% captés" value={`${finance.cardsTo80} cartes`} />
                              <MiniStat label="90% captés" value={`${finance.cardsTo90} cartes`} />
                            </div>
                          </div>
                        </CardBody>
                      </CardShell>
                    </TabsContent>
                  ) : null}

                  {/* ===== Top ===== */}
                  <TabsContent value="top" className="m-0 space-y-4">
                    {isPro ? (
                      <CardShell>
                        <CardHeaderRow
                          title="Top cartes"
                          subtitle="Recherche + tri pour scanner vite."
                          right={<Badge variant="secondary" className="text-[11px]">Top 10</Badge>}
                        />
                        <CardBody>
                          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                            <div className="relative">
                              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Rechercher une carte…"
                                className="pl-9"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant={sort === "price_desc" ? "secondary" : "outline"}
                                className="rounded-xl"
                                onClick={() => setSort("price_desc")}
                                title="Prix décroissant"
                              >
                                <ArrowDownAZ className="mr-2 h-4 w-4" />
                                Prix
                              </Button>
                              <Button
                                type="button"
                                variant={sort === "name_asc" ? "secondary" : "outline"}
                                className="rounded-xl"
                                onClick={() => setSort("name_asc")}
                                title="Nom A→Z"
                              >
                                <ArrowUpAZ className="mr-2 h-4 w-4" />
                                Nom
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl border bg-background/70 p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold">Micro-courbe des prix</p>
                                <p className="text-xs text-muted-foreground">Prix triés (bas → haut) pour sentir la distribution.</p>
                              </div>
                              <span className="text-xs text-muted-foreground font-mono">{finance.frCount} prix</span>
                            </div>

                            <div className="mt-3 rounded-xl border border-border/60 bg-muted/40 px-2 py-2" role="img" aria-label="Courbe des prix FR triés">
                              {finance.priceCurve.length === 0 ? (
                                <div className="text-xs text-muted-foreground">Données insuffisantes.</div>
                              ) : (
                                <Sparkline
                                  values={finance.priceCurve}
                                  height={82}
                                  strokeClassName="text-primary"
                                  withFill
                                  strokeWidth={2.6}
                                  animated
                                  drawDurationMs={850}
                                  loopDelayMs={1500}
                                  showEndDot
                                  padding={4}
                                />
                              )}
                            </div>

                            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                              <span>Bas</span>
                              <span>Distribution</span>
                              <span>Haut</span>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="rounded-xl border bg-muted/30 p-2">
                              <p className="text-[11px] text-muted-foreground">Top 1</p>
                              <p className="text-sm font-semibold tabular-nums">
                                {finance.top10.length ? eur(finance.top10[0].sig.value) : "—"}
                              </p>
                            </div>
                            <div className="rounded-xl border bg-muted/30 p-2">
                              <p className="text-[11px] text-muted-foreground">Top 5</p>
                              <p className="text-sm font-semibold tabular-nums">{finance.top5SharePct}%</p>
                            </div>
                            <div className="rounded-xl border bg-muted/30 p-2">
                              <p className="text-[11px] text-muted-foreground">Top 10</p>
                              <p className="text-sm font-semibold tabular-nums">{finance.top10SharePct}%</p>
                            </div>
                          </div>

                          <p className="mt-2 text-xs text-muted-foreground">
                            Barre = prix relatif vs #1 · Part du set = % de la valeur totale (FR).
                          </p>
                        </CardBody>
                      </CardShell>
                    ) : (
                      <CardShell>
                        <CardHeaderRow
                          title="Top cartes"
                          subtitle="Recherche + tri + Distribution"
                          right={<Badge variant="secondary" className="text-[11px]">Top 10</Badge>}
                        />
                        <CardBody>
                          <div className="relative overflow-hidden rounded-2xl border bg-muted/20 p-4 ring-1 ring-border/30">
                            <div className="pointer-events-none blur-[2px] opacity-70">
                              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                              <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                Rechercher une carte…
                              </div>
                              <div className="flex gap-2">
                                <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                  Prix
                                </div>
                                <div className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                                  Nom
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 rounded-2xl border bg-background/70 p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-semibold">Micro-courbe des prix</p>
                                  <p className="text-xs text-muted-foreground">Prix triés (bas → haut) pour sentir la distribution.</p>
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">— prix</span>
                              </div>

                              <div className="mt-3 rounded-xl border border-border/60 bg-muted/40 px-2 py-2" role="img" aria-label="Aperçu micro-courbe">
                                <Sparkline
                                  values={[1, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7]}
                                  height={82}
                                  strokeClassName="text-primary"
                                  withFill
                                  strokeWidth={2.6}
                                  animated
                                  drawDurationMs={850}
                                  loopDelayMs={1500}
                                  showEndDot
                                  padding={4}
                                />
                              </div>

                              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                <span>Bas</span>
                                <span>Distribution</span>
                                <span>Haut</span>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2">
                              <div className="rounded-xl border bg-muted/30 p-2">
                                <p className="text-[11px] text-muted-foreground">Top 1</p>
                                <p className="text-sm font-semibold tabular-nums">—</p>
                              </div>
                              <div className="rounded-xl border bg-muted/30 p-2">
                                <p className="text-[11px] text-muted-foreground">Top 5</p>
                                <p className="text-sm font-semibold tabular-nums">—</p>
                              </div>
                              <div className="rounded-xl border bg-muted/30 p-2">
                                <p className="text-[11px] text-muted-foreground">Top 10</p>
                                <p className="text-sm font-semibold tabular-nums">—</p>
                              </div>
                            </div>
                            </div>

                            <div className="mt-4 rounded-xl border bg-background/70 p-4 text-center">
                              <p className="text-xs font-semibold">Top cartes Pro</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Accédez à la recherche, au tri et au classement.
                              </p>
                              <Button asChild variant="secondary" className="mt-3 w-full rounded-lg">
                                <Link href="/pricing">Devenir Pro</Link>
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </CardShell>
                    )}

                    {filteredTop.length === 0 ? (
                      <div className="rounded-2xl border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                        Aucun résultat.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredTop.map((x, idx) => {
                          const share = finance.totalFR ? x.sig.value / finance.totalFR : 0;
                          const width = Math.round((x.sig.value / (finance.topMax || 1)) * 100);

                          return (
                            <button
                              key={x.c.id}
                              type="button"
                              onClick={() => handleTopCardSelect(x.c)}
                              className="w-full rounded-2xl border bg-card p-3 text-left shadow-sm transition
                                hover:bg-muted/40 active:scale-[0.99]
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                              aria-label={`Ouvrir ${x.c.name}`}
                            >
                              <div className="grid grid-cols-[22px_44px_minmax(0,1fr)_auto] items-center gap-3">
                                <div className="text-center text-xs font-mono text-muted-foreground">
                                  {idx + 1}
                                </div>

                                <div className="h-11 w-11 rounded-xl bg-muted/40 overflow-hidden border flex items-center justify-center shrink-0">
                                  {x.c.image ? (
                                    <img src={x.c.image} alt={x.c.name} className="h-full w-full object-contain" />
                                  ) : (
                                    <span className="text-lg">🃏</span>
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate">{x.c.name}</p>
                                  <div className="mt-1 flex flex-wrap gap-1.5">
                                    {x.c.rarity ? (
                                      <Badge variant="secondary" className="text-[10px] px-2">
                                        {x.c.rarity}
                                      </Badge>
                                    ) : null}
                                    <Badge variant="outline" className="text-[10px] px-2 font-mono">
                                      #{x.c.card_number ?? "—"}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-2 font-mono tabular-nums"
                                      title="Part de la valeur totale du set (FR)"
                                    >
                                      Part {Math.round(share * 100)}%
                                    </Badge>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className="text-xs font-semibold tabular-nums whitespace-nowrap">
                                    {eur(x.sig.value)}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3 flex items-center gap-2">
                                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full bg-primary/70" style={{ width: `${width}%` }} />
                                </div>
                                <span className="text-[11px] text-muted-foreground font-mono">Poids</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
