// app/not-found.tsx
"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { motion, useReducedMotion } from "framer-motion"

export default function NotFound() {
  const prefersReducedMotion = useReducedMotion()
  const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: EASE_OUT }}
        className="w-full max-w-2xl"
      >
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-xl">
          {/* bande “chantier” style Pokéindex */}
          <div
            className="h-10 w-full border-b border-border/50"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(250,204,21,0.95) 0 14px, rgba(17,24,39,0.95) 14px 28px)",
              backgroundSize: "80px 80px",
            }}
            aria-hidden="true"
          />

          <div className="p-6 sm:p-10 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-xs font-semibold text-muted-foreground">
                Erreur 404
              </span>
            </div>

            <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
              <span className="block">Page introuvable</span>
              <span className="block mt-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                on s’est perdu dans les hautes herbes
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-muted-foreground/90 max-w-xl mx-auto">
              Le lien est peut-être cassé, ou la page a été déplacée.
              Retourne à l’accueil pour continuer à explorer l’index.
            </p>

            <div className="mt-8 flex justify-center">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl font-semibold shadow-md
                  bg-gradient-to-r from-primary to-primary/80
                  hover:shadow-lg transition-all"
              >
                <Link href="/" aria-label="Retour à l'accueil">
                  Retour à l’accueil
                  <Icons.linechart className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="mt-6 text-xs text-muted-foreground">
            “Si tu abandonnes maintenant, tu n’iras jamais jusqu’au bout.” — Ash Ketchum
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
