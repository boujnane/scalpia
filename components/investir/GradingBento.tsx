import { Shield, ArrowRight, CheckCircle2, XCircle, BadgeCheck } from "lucide-react";

import { BentoGrid, BentoTile } from "@/components/investir/Bento";

export function GradingBento() {
  return (
    <BentoGrid className="grid-cols-1 lg:grid-cols-12">
      <BentoTile accent="blue" className="lg:col-span-7">
        <p className="text-xs font-medium text-muted-foreground">Objectif</p>
        <h3 className="mt-1 text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-sky-500" aria-hidden="true" />
          Le grading : un process en 5 étapes
        </h3>

        <ol className="mt-4 space-y-3">
          {[
            {
              title: "Pré-sélection",
              desc: "Choisir une carte qui a du sens (demande + rareté + état probable).",
            },
            {
              title: "Prépa & protections",
              desc: "Sleeve + Top-Loader semi-rigide, photos/scan, noter les défauts visibles.",
            },
            {
              title: "Choix de la société / service",
              desc: "Délai, coût, réputation et liquidité à la revente.",
            },
            {
              title: "Envoi",
              desc: "Emballage sérieux, assurance, tracking, déclarations si international.",
            },
            {
              title: "Retour & arbitrage",
              desc: "Conserver, vendre, ou regrader : le “net” compte plus que le prix affiché.",
            },
          ].map((step, idx) => (
            <li key={step.title} className="flex gap-3">
              <div className="mt-0.5 h-7 w-7 rounded-full bg-background/60 border border-border/50 grid place-items-center text-xs font-semibold text-foreground">
                {idx + 1}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  {step.title} <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </BentoTile>

      <BentoTile accent="neutral" className="lg:col-span-5">
        <p className="text-xs font-medium text-muted-foreground">Décision</p>
        <h3 className="mt-1 text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-success" aria-hidden="true" />
          Quand ça vaut le coup (et quand éviter)
        </h3>

        <div className="mt-4">
          <p className="text-xs font-semibold text-foreground">✅ Pertinent quand</p>
          <ul className="mt-2 space-y-2">
            {[
              "La carte a une demande forte et stable (au-delà de la bulle du moment)",
              "L’état a une chance réaliste de sortir haut (centrage, bords, surface)",
              "Le surcoût grading + délais est couvert par la prime à la revente",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" aria-hidden="true" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold text-foreground">❌ À éviter quand</p>
          <ul className="mt-2 space-y-2">
            {[
              "La valeur de base est faible (les frais mangent le rendement)",
              "Tu es incertain sur l’authenticité ou l’état réel",
              "Tu as besoin de liquidité rapide (délai et immobilisation)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" aria-hidden="true" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </BentoTile>
    </BentoGrid>
  );
}

