// app/en-construction/page.tsx
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { motion, useReducedMotion } from "framer-motion"

export default function UnderConstructionPage() {
  const prefersReducedMotion = useReducedMotion()

  const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]
  const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1]

  const container = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: EASE_OUT },
  }

  const toolTap = prefersReducedMotion
    ? {}
    : {
        animate: { y: [0, -6, 0] as number[] },
        transition: { duration: 1.2, repeat: Infinity, ease: EASE_IN_OUT },
      }

  const stripesMove = prefersReducedMotion
    ? {}
    : {
        animate: { backgroundPositionX: ["0px", "56px"] as string[] },
        transition: { duration: 1.4, repeat: Infinity, ease: "linear" as const },
      }

  const tapeMove = prefersReducedMotion
    ? {}
    : {
        animate: { backgroundPositionX: ["0px", "80px"] as string[] },
        transition: { duration: 1.8, repeat: Infinity, ease: "linear" as const },
      }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* fond léger */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />

      <main className="container mx-auto px-4 sm:px-6 md:px-8 py-14 sm:py-20">
        <motion.div
          className="relative mx-auto max-w-4xl"
          {...container}
        >

          {/* Carte principale */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-xl overflow-hidden">
            {/* “Tape” haut (bande signalisation animée) */}
            <motion.div
              className="h-10 w-full border-b border-border/50"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(250,204,21,0.95) 0 14px, rgba(17,24,39,0.95) 14px 28px)",
                backgroundSize: "80px 80px",
              }}
              {...tapeMove}
              aria-hidden="true"
            />

            <div className="p-6 sm:p-10">
              {/* Badge compact */}
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  Page en construction
                </span>
              </div>

              {/* Headline */}
              <div className="mt-5 space-y-4">
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
                  <span className="block">On est en travaux.</span>
                  <span className="block mt-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Retour très bientôt.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground/90 max-w-2xl">
                  On finalise cette page pour qu’elle soit plus claire, plus stable et plus rapide.
                  En attendant, tu peux continuer à utiliser les fonctionnalités principales.
                </p>
              </div>

              {/* Icône “outil” simple */}
              <div className="mt-6 flex items-center gap-3">
                <motion.div
                  className="h-11 w-11 rounded-xl border border-border/60 bg-background/60 flex items-center justify-center"
                  {...toolTap}
                  aria-hidden="true"
                >
                  <Icons.zap className="h-5 w-5 text-primary" />
                </motion.div>
                <div className="text-xs sm:text-sm">
                  <div className="font-semibold">Mise à niveau en cours</div>
                  <div className="text-muted-foreground">UI · Responsive · Performances</div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-12 sm:h-13 rounded-xl font-semibold shadow-md
                    bg-gradient-to-r from-primary to-primary/80
                    hover:shadow-lg transition-all w-full sm:w-auto"
                >
                  <Link href="/tcgdex" aria-label="Rechercher une carte ou une série">
                    Rechercher
                    <Icons.search className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 sm:h-13 rounded-xl font-semibold
                    border-border/60 bg-background/40 hover:bg-muted/40
                    transition-all w-full sm:w-auto"
                >
                  <Link href="/analyse" aria-label="Analyser les produits scellés">
                    Analyser
                    <Icons.linechart className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>

                            {/* Single CTA -> Home */}
                            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Merci pour ta patience 💛
                  <span className="block sm:inline sm:ml-1">
                    — retour à l’accueil pour continuer à naviguer.
                  </span>
                </div>

                <Button
                  asChild
                  size="lg"
                  className="h-12 sm:h-13 rounded-xl font-semibold shadow-md
                    bg-gradient-to-r from-primary to-primary/80
                    hover:shadow-lg transition-all w-full sm:w-auto"
                >
                  <Link href="/" aria-label="Retourner à l'accueil">
                    Retour à l’accueil
                    <Icons.linechart className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Barrière bas : stripes + léger mouvement */}
            <motion.div
              className="h-10 w-full border-b border-border/50"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, rgba(250,204,21,0.95) 0 14px, rgba(17,24,39,0.95) 14px 28px)",
                backgroundSize: "80px 80px",
              }}
              {...tapeMove}
              aria-hidden="true"
            />
          </div>
        </motion.div>
      </main>

    </div>
  )
}
