import {
  AlertTriangle,
  TrendingDown,
  Shield,
  Package,
  Clock,
  Coins,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

import { BentoGrid, BentoTile } from "@/components/investir/Bento";
import { cn } from "@/lib/utils";

const risks = [
  {
    icon: TrendingDown,
    title: "Volatilité",
    desc: "Corrections rapides possibles (hype, rotation d’attention, annonces officielles, réassorts).",
  },
  {
    icon: Package,
    title: "Réassorts / reprints",
    desc: "Peuvent comprimer durablement les prix, surtout sur le scellé moderne et les produits « mass market ».",
  },
  {
    icon: Shield,
    title: "Contrefaçons & rescellés",
    desc: "Risque accru hors circuits établis : qualité du film, plis suspects, traces de chauffe et provenance.",
  },
  {
    icon: Coins,
    title: "Liquidité réelle",
    desc: "Prix affiché ≠ prix vendu : délais, négociation, frais, litiges et retours impactent fortement le net.",
  },
  {
    icon: Shield,
    title: "Condition à la revente",
    desc: "Le scellé est sensible : micro-chocs, coins écrasés ou film détendu entraînent une décote immédiate.",
  },
  {
    icon: Clock,
    title: "Stockage & coût du temps",
    desc: "Espace, conditions (UV, humidité, chocs) et temps de gestion doivent être intégrés au rendement réel.",
  },
  {
    icon: Sparkles,
    title: "Effet de mode",
    desc: "Les séries « à la mode » montent vite… mais la demande peut se déplacer tout aussi rapidement.",
  },
] as const;

const checklist = [
  {
    title: "Comparer le net",
    desc: "Prix − (frais, port, assurance, retours, litiges potentiels)",
  },
  {
    title: "Exiger des photos claires",
    desc: "Coins, scellage, angles, code produit et cohérence générale",
  },
  {
    title: "Vérifier le vendeur",
    desc: "Ancienneté, historique, réputation et cohérence des ventes",
  },
  {
    title: "Se méfier des « trop bonnes affaires »",
    desc: "Un prix anormalement bas cache souvent un risque non visible",
  },
  {
    title: "Mode de paiement",
    desc: "Méfiez vous des demandes de paiements paypal entre proches et virement bancaire",
  },
  {
    title: "Anticiper le stockage",
    desc: "Protection contre UV, humidité et chocs dès l’achat",
  },
  {
    title: "Préserver sa marge de manœuvre",
    desc: "Un achat ne doit pas bloquer tout ton budget ou ta flexibilité.",
  },
  {
    title: "Remise en mains propres",
    desc: "Une vraie RMP implique un lieu précis et public. La mention « RMP 64 / Pyrénées Atlantique » est parfois utilisée car la distance avec les principales métropoles française décourage la rencontre et pousse l’acheteur à accepter un envoi.",
  },
] as const;

export function RisksBento() {
  return (
    <BentoGrid className="grid-cols-1 lg:grid-cols-12">
      {/* Risques - Carte principale */}
      <BentoTile accent="warning" className="lg:col-span-7">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-amber-500/10">
            <AlertTriangle className="w-5 h-5 text-amber-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              À intégrer avant d’acheter
            </p>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              Les risques clés
            </h3>
          </div>
        </div>

        {/* Liste des risques */}
        <ul className="space-y-4">
          {risks.map((risk) => (
            <li key={risk.title} className="flex items-start gap-3">
              <div className="p-2 rounded-lg shrink-0 mt-0.5 bg-muted/80">
                <risk.icon
                  className="w-4 h-4 text-amber-500/80"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {risk.title}
                </p>
                <p className="text-[13px] text-muted-foreground leading-relaxed mt-0.5">
                  {risk.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </BentoTile>

      {/* Checklist - Carte secondaire */}
      <BentoTile accent="success" className="lg:col-span-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10">
            <ShieldCheck className="w-5 h-5 text-emerald-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Anti-bad buys
            </p>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              Checklist scellé
            </h3>
          </div>
        </div>

        {/* Liste checklist */}
        <ul className="space-y-3">
          {checklist.map((item, index) => (
            <li key={item.title} className="flex items-start gap-3">
              <div
                className={cn(
                  "flex items-center justify-center",
                  "w-6 h-6 rounded-full shrink-0",
                  "bg-emerald-500/10",
                  "text-xs font-semibold text-emerald-500"
                )}
              >
                {index + 1}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </BentoTile>
    </BentoGrid>
  );
}
