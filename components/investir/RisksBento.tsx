import {
  AlertTriangle,
  TrendingDown,
  Shield,
  Package,
  Clock,
  Coins,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { BentoGrid, BentoTile } from "@/components/investir/Bento";
import { cn } from "@/lib/utils";

const risks = [
  {
    icon: TrendingDown,
    title: "Volatilité",
    desc: "Corrections rapides possibles (hype, rotation d’attention, annonces, réassorts).",
    accent: "warning",
  },
  {
    icon: Package,
    title: "Réassorts / reprints",
    desc: "Peuvent comprimer les prix, surtout sur le scellé moderne et les produits “mass market”.",
    accent: "warning",
  },
  {
    icon: Shield,
    title: "Contrefaçons & re-scells",
    desc: "Risque plus élevé hors circuits connus : photos, vendeur, scellage, poids, provenance.",
    accent: "warning",
  },
  {
    icon: Coins,
    title: "Liquidité réelle",
    desc: "Prix affiché ≠ prix vendu : délais, négociation, frais et retours impactent le net.",
    accent: "warning",
  },
  {
    icon: Clock,
    title: "Stockage & coût du temps",
    desc: "Espace, conditions (UV/humidité/chocs) et temps de gestion : ça compte dans le rendement.",
    accent: "warning",
  },
  {
    icon: Sparkles,
    title: "Effet de mode",
    desc: "Les séries “à la mode” montent vite… et peuvent dégonfler tout aussi vite.",
    accent: "warning",
  },
] as const;

export function RisksBento() {
  return (
    <BentoGrid className="grid-cols-1 lg:grid-cols-12">
      <BentoTile accent="warning" className="lg:col-span-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">À intégrer avant d’acheter</p>
            <h3 className="mt-1 text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" aria-hidden="true" />
              Les risques clés (version courte)
            </h3>
          </div>
        </div>

        <ul className="mt-4 space-y-3">
          {risks.map((risk) => (
            <li key={risk.title} className="flex gap-3">
              <div className="mt-0.5 rounded-lg border border-border/50 bg-background/50 p-2 shrink-0">
                <risk.icon className="w-4 h-4 text-foreground/80" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{risk.title}</p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{risk.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </BentoTile>

      <BentoTile accent="neutral" className="lg:col-span-5">
        <p className="text-xs font-medium text-muted-foreground">Anti-bad buys</p>
        <h3 className="mt-1 text-base sm:text-lg font-semibold text-foreground">
          Checklist scellé (rapide)
        </h3>

        <ul className="mt-4 space-y-2">
          {[
            "Comparer le net vendeur : frais, port, assurance, retours",
            "Exiger photos HD (coins, scellage, angles, code produit)",
            "Vérifier provenance + historique du vendeur",
            "Éviter les “bonnes affaires” trop belles",
            "Stockage : UV, humidité, chocs (boîtes qui s’écrasent)",
            "Penser à la revente : plateforme + audience cible",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" aria-hidden="true" />
              <span className={cn("leading-relaxed")}>{item}</span>
            </li>
          ))}
        </ul>
      </BentoTile>
    </BentoGrid>
  );
}

