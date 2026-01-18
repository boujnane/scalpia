"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Activity,
  TrendingUp,
  Gauge,
  Shield,
  Info,
  Target,
  AlertCircle,
  Zap,
} from "lucide-react";

function Pill({ className }: { className?: string }) {
  return <div className={cn("h-4 rounded-full bg-foreground/10", className)} />;
}

function Bar({ w }: { w: number }) {
  return (
    <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
      <div className="h-full bg-foreground/15 rounded-full" style={{ width: `${w}%` }} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────── */
/* 1) MarketSentimentWidgetPreview                                 */
/* ────────────────────────────────────────────────────────────── */
export function MarketSentimentWidgetPreview({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Sentiment du Marché
          <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Info className="w-3 h-3" /> aperçu
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* jauge fake */}
        <div className="relative w-full max-w-[200px] mx-auto aspect-[2/1]">
          <svg viewBox="0 0 200 100" className="w-full h-full text-foreground/20">
            <path
              d="M 20 95 A 80 80 0 0 1 180 95"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              className="opacity-40"
            />
            <path
              d="M 20 95 A 80 80 0 0 1 180 95"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="150 251"
              className="opacity-80"
            />
          </svg>

          <div
            className="absolute bottom-0 left-1/2 w-1 h-[70px] origin-bottom"
            style={{ transform: `translateX(-50%) rotate(15deg)` }}
          >
            <div className="w-full h-full rounded-full bg-foreground/30" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-foreground/60" />
          </div>
        </div>

        {/* score fake */}
        <div className="text-center">
          <div className="mx-auto w-16 h-10 rounded-lg bg-foreground/10" />
          <div className="mx-auto w-20 h-3 rounded bg-foreground/10 mt-2" />
        </div>

        {/* stats fake */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {["Hausse", "Stable", "Baisse"].map((lbl) => (
            <div key={lbl} className="p-2 rounded-lg bg-foreground/5 border border-border/30">
              <div className="mx-auto w-7 h-5 rounded bg-foreground/10" />
              <p className="text-[10px] text-muted-foreground mt-1">{lbl}</p>
            </div>
          ))}
        </div>

        {/* composantes fake */}
        <div className="space-y-2 pt-2 border-t border-border/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">
              Composantes
            </span>
            <Pill className="w-14" />
          </div>

          {[
            { icon: Activity, label: "Dynamique", w: 62 },
            { icon: Gauge, label: "Momentum", w: 48 },
            { icon: TrendingUp, label: "Performance", w: 71 },
            { icon: Shield, label: "Stabilité", w: 55 },
          ].map((row, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <row.icon className="w-3 h-3 text-foreground/40" />
                  <span className="text-[11px] font-medium">{row.label}</span>
                </div>
                <Pill className="w-10" />
              </div>
              <Bar w={row.w} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────── */
/* 2) VolatilityGaugeWidgetPreview                                  */
/* ────────────────────────────────────────────────────────────── */
export function VolatilityGaugeWidgetPreview({ className }: { className?: string }) {
  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Volatilité & Risque
          <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Info className="w-3 h-3" /> aperçu
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        <div className="text-center py-2">
          <div className="mx-auto w-24 h-10 rounded-lg bg-foreground/10" />
          <div className="mx-auto w-28 h-3 rounded bg-foreground/10 mt-2" />
          <div className="mx-auto w-40 h-3 rounded bg-foreground/10 mt-2" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Distribution</p>

          {[
            { label: "<2%", w: 22 },
            { label: "2-4%", w: 40 },
            { label: "4-7%", w: 65 },
            { label: "7-10%", w: 35 },
            { label: ">10%", w: 18 },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-10 text-right tabular-nums">
                {r.label}
              </span>
              <div className="flex-1">
                <Bar w={r.w} />
              </div>
              <Pill className="w-8" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-[10px] text-muted-foreground mb-1">Plus volatile</p>
            <div className="w-24 h-4 rounded bg-foreground/10" />
            <div className="w-14 h-4 rounded bg-foreground/10 mt-2" />
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-[10px] text-muted-foreground mb-1">Plus stable</p>
            <div className="w-24 h-4 rounded bg-foreground/10" />
            <div className="w-14 h-4 rounded bg-foreground/10 mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────── */
/* 3) RiskReturnScatterPreview (NOUVEAU)                            */
/* ────────────────────────────────────────────────────────────── */
/**
 * Preview safe qui imite ton scatter (axes + quadrants + points)
 * ✅ Aucun chiffre réel, aucune data récupérable.
 * ✅ Pas besoin de recharts : c'est un SVG léger (plus safe, plus stable).
 */
export function RiskReturnScatterPreview({ className }: { className?: string }) {
  // ✅ Points “premium”: un peu plus nombreux + tailles cohérentes + distribution plus crédible
  const points = useMemo(
    () => [
      // Haut-gauche (sweet spot)
      { x: -204, y: 28, r: 6, tone: "fill-emerald-500/70", stroke: "stroke-emerald-500/40" },
      { x: 30, y: 36, r: 8, tone: "fill-emerald-400/55", stroke: "stroke-emerald-400/35" },
      { x: 36, y: 22, r: 5, tone: "fill-emerald-500/45", stroke: "stroke-emerald-500/25" },

      // Haut-droite (bon retour mais risqué)
      { x: -60, y: 26, r: 7, tone: "fill-yellow-500/65", stroke: "stroke-yellow-500/35" },
      { x: 94, y: 34, r: 10, tone: "fill-orange-500/60", stroke: "stroke-orange-500/35" },
      { x: 58, y: 18, r: 6, tone: "fill-yellow-500/45", stroke: "stroke-yellow-500/25" },

      // Bas-gauche (stable mais faible retour)
      { x: -26, y: 70, r: 7, tone: "fill-muted-foreground/35", stroke: "stroke-muted-foreground/25" },
      { x: -140, y: 62, r: 6, tone: "fill-muted-foreground/25", stroke: "stroke-muted-foreground/20" },

      // Bas-droite (mauvais: risqué + faible)
      { x: 198, y: 76, r: 9, tone: "fill-red-500/60", stroke: "stroke-red-500/35" },
      { x: 160, y: 64, r: 6, tone: "fill-red-500/35", stroke: "stroke-red-500/25" },

      // Centre (moyen)
      { x: 52, y: 54, r: 6, tone: "fill-slate-400/35", stroke: "stroke-slate-400/25" },
      { x: 60, y: 58, r: 5, tone: "fill-slate-400/25", stroke: "stroke-slate-400/20" },
    ],
    []
  );

  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Risque / Rendement
          <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Info className="w-3 h-3" /> aperçu
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {/* ✅ container plus “premium”: gradient + overlay discret */}
        <div className="relative h-[280px] -mx-2 rounded-lg border border-border/30 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 p-3 overflow-hidden">
          {/* glow subtil */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/10 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-12 -left-10 w-44 h-44 rounded-full bg-purple-500/10 blur-2xl"
            aria-hidden="true"
          />

          {/* zone chart */}
          <div className="relative h-[220px] rounded-md border border-border/30 bg-background/30 backdrop-blur-[2px] p-2">
            <svg viewBox="0 0 100 100" className="w-full h-full text-foreground/30" aria-hidden="true">
              {/* plot area (padding visuel) */}
              <rect x="10" y="10" width="86" height="82" rx="3" fill="transparent" />

              {/* axes */}
              <line x1="12" y1="90" x2="94" y2="90" stroke="currentColor" strokeOpacity="0.25" />
              <line x1="12" y1="90" x2="12" y2="10" stroke="currentColor" strokeOpacity="0.25" />

              {/* grid */}
              {[20, 30, 40, 50, 60, 70, 80].map((g) => (
                <React.Fragment key={g}>
                  <line x1="12" y1={g} x2="94" y2={g} stroke="currentColor" strokeOpacity="0.06" />
                  <line x1={g} y1="90" x2={g} y2="10" stroke="currentColor" strokeOpacity="0.06" />
                </React.Fragment>
              ))}

              {/* ref lines (moyennes) */}
              <line
                x1="55"
                y1="90"
                x2="55"
                y2="10"
                stroke="currentColor"
                strokeOpacity="0.18"
                strokeDasharray="3 3"
              />
              <line
                x1="12"
                y1="55"
                x2="94"
                y2="55"
                stroke="currentColor"
                strokeOpacity="0.18"
                strokeDasharray="3 3"
              />
              <line x1="12" y1="65" x2="94" y2="65" stroke="currentColor" strokeOpacity="0.10" />

              {/* quadrant labels (meilleure lisibilité) */}
              <text x="16" y="18" fontSize="4" fill="currentColor" opacity="0.60">
                Retour ↑
              </text>
              <text x="16" y="23" fontSize="4" fill="currentColor" opacity="0.42">
                Risque ↓
              </text>

              <text x="63" y="18" fontSize="4" fill="currentColor" opacity="0.52">
                Retour ↑
              </text>
              <text x="63" y="23" fontSize="4" fill="currentColor" opacity="0.38">
                Risque ↑
              </text>

              <text x="16" y="84" fontSize="4" fill="currentColor" opacity="0.42">
                Retour ↓
              </text>
              <text x="16" y="89" fontSize="4" fill="currentColor" opacity="0.32">
                Risque ↓
              </text>

              <text x="63" y="84" fontSize="4" fill="currentColor" opacity="0.42">
                Retour ↓
              </text>
              <text x="63" y="89" fontSize="4" fill="currentColor" opacity="0.32">
                Risque ↑
              </text>

              {/* ✅ “sweet spot” highlight (haut-gauche) */}
              <rect
                x="12"
                y="10"
                width="43"
                height="45"
                rx="3"
                fill="currentColor"
                opacity="0.04"
              />

              {/* points */}
              {points.map((p, i) => (
                <g key={i}>
                  {/* halo */}
                  <circle cx={p.x} cy={p.y} r={p.r + 2} fill="currentColor" opacity="0.03" />
                  {/* point */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.r}
                    className={cn(p.tone, p.stroke)}
                    strokeWidth="0.8"
                  />
                </g>
              ))}
            </svg>

            {/* labels axes (fake mais pro) */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">
              Volatilité (30j)
            </div>
            <div
              className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground"
              style={{ transformOrigin: "left center" }}
            >
              Rendement (30j)
            </div>
          </div>

          {/* légende */}
          <div className="mt-3 pt-3 border-t border-border/40 text-[11px] flex flex-wrap items-center justify-center gap-4">
            <span className="text-muted-foreground font-medium">Sharpe :</span>

            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <span className="text-foreground">&gt; 1</span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="text-foreground">0 - 1</span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="text-foreground">&lt; 0</span>
            </span>

            {/* petit hint */}
            <span className="text-muted-foreground/70">
              Idéal : en haut à gauche
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


/* ────────────────────────────────────────────────────────────── */
/* 4) SignalsWidgetPreview (NOUVEAU)                                */
/* ────────────────────────────────────────────────────────────── */
/**
 * Preview safe qui imite la liste de signaux + badges + “analyse avancée”
 * ✅ Aucun signal réel, aucune série réelle.
 */
export function SignalsWidgetPreview({ className }: { className?: string }) {
  const tags = [
    { label: "Survendu", tone: "bg-emerald-500/10 text-emerald-500", icon: TrendingUp },
    { label: "Breakout", tone: "bg-green-500/10 text-green-500", icon: Zap },
    { label: "Momentum", tone: "bg-blue-500/10 text-blue-500", icon: Activity },
    { label: "Suracheté", tone: "bg-amber-500/10 text-amber-500", icon: TrendingUp },
  ];

  const rows = [
    { strength: "FORT", badge: "Survendu", tone: "text-emerald-500", w: 72 },
    { strength: "", badge: "Breakout haussier", tone: "text-green-500", w: 55 },
    { strength: "FORT", badge: "Momentum positif", tone: "text-blue-500", w: 64 },
    { strength: "", badge: "Suracheté", tone: "text-amber-500", w: 48 },
    { strength: "", badge: "Breakout baissier", tone: "text-red-500", w: 42 },
  ];

  return (
    <Card className={cn("border-border/50 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-primary" />
          Signaux Actifs
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="px-2 py-0.5 rounded-full bg-muted/60 border border-border/40">
              12
            </span>
          </span>
          <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Info className="w-3 h-3" /> aperçu
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* summary tags */}
        <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border/50">
          {tags.map((t, i) => {
            const Icon = t.icon;
            return (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                  t.tone
                )}
              >
                <Icon className="w-3 h-3 opacity-80" />
                {t.label}: <span className="opacity-80">{Math.max(1, i + 1)}</span>
              </span>
            );
          })}
        </div>

        {/* fake list */}
        <div className="space-y-1 max-h-[300px] overflow-hidden px-0.5">
          {rows.map((r, idx) => (
            <div
              key={idx}
              className={cn(
                "w-full flex items-start gap-2 p-2 rounded-lg",
                "bg-muted/20 border border-border/30"
              )}
            >
              <div className={cn("p-1.5 rounded-md shrink-0 bg-primary/10 border border-primary/10")}>
                <Zap className={cn("w-3.5 h-3.5", r.tone)} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-32 rounded bg-foreground/10" />
                  {r.strength && (
                    <span className="text-[8px] px-1 py-0 h-4 inline-flex items-center rounded bg-primary text-primary-foreground">
                      {r.strength}
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  <div className="h-3 w-56 rounded bg-foreground/10" />
                </div>

                {/* tiny “confidence bar” */}
                <div className="mt-2">
                  <Bar w={r.w} />
                </div>
              </div>

              <span className={cn("shrink-0 text-[10px] px-2 py-1 rounded-full border border-border/40 bg-muted/40", r.tone)}>
                {r.badge}
              </span>
            </div>
          ))}
        </div>

        {/* “analyse avancée” preview */}
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Analyse avancée
            </p>
            <Pill className="w-20" />
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Bar w={68} />
              </div>
              <div className="h-5 w-14 rounded bg-foreground/10" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-success/10 border border-success/20">
                <div className="h-3 w-20 rounded bg-foreground/10" />
                <div className="h-5 w-10 rounded bg-foreground/10 mt-2" />
              </div>
              <div className="p-2 rounded bg-destructive/10 border border-destructive/20">
                <div className="h-3 w-20 rounded bg-foreground/10" />
                <div className="h-5 w-10 rounded bg-foreground/10 mt-2" />
              </div>
            </div>
          </div>

          <p className="mt-2 text-[10px] text-muted-foreground">
            (aperçu) Résumé des signaux, conviction et répartition.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
