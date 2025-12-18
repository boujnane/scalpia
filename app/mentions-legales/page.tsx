// app/mentions-legales/page.tsx
"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export default function MentionsLegalesPage() {
  const prefersReducedMotion = useReducedMotion()

  const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

  const container = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.45, ease: EASE_OUT },
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* fond léger */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />

      <main className="container mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-16">
        <motion.div className="mx-auto max-w-4xl" {...container}>
          {/* Header */}
          <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-muted-foreground">
                Informations légales
              </span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="block">Mentions légales</span>
              <span className="block mt-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Pokéindex.fr
              </span>
            </h1>

            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
              Conformément aux dispositions de la loi n°2004-575 du 21 juin 2004 pour la
              confiance dans l’économie numérique (LCEN).
            </p>
          </div>

          {/* Contenu */}
          <div className="mt-6 space-y-6">
            <Section title="Éditeur du site" icon={<Icons.search className="h-5 w-5 text-primary" />}>
              <ul className="space-y-2">
                <li>
                  <strong>Boujnane Ady / Raison sociale :</strong> []
                </li>
                <li>
                  <strong>Statut :</strong> [Particulier]
                </li>
                <li>
                  <strong>Email :</strong> [contact@pokeindex.fr]
                </li>
              </ul>
            </Section>

            <Section title="Hébergement" icon={<Icons.LineChart className="h-5 w-5 text-primary" />}>
              <ul className="space-y-2">
                <li>
                  <strong>Hébergeur :</strong> Vercel Inc.
                </li>
                <li>
                  <strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA
                </li>
                <li>
                  <strong>Site :</strong>{" "}
                  <a
                    href="https://vercel.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-4"
                  >
                    https://vercel.com
                  </a>
                </li>
              </ul>
            </Section>

            <Section title="Propriété intellectuelle" icon={<Icons.zap className="h-5 w-5 text-primary" />}>
              <p>
                L’ensemble des éléments constituant le site Pokéindex (structure, code,
                interface, textes, graphiques, algorithmes, bases de données, logo)
                est protégé par le droit de la propriété intellectuelle.
              </p>
              <p className="mt-3">
                Toute reproduction, représentation ou exploitation, totale ou partielle,
                sans autorisation écrite préalable est strictement interdite.
              </p>
            </Section>

            <Section title="Données issues de tiers" icon={<Icons.wallet className="h-5 w-5 text-primary" />}>
              <p>
                Pokéindex agrège et analyse des informations de prix issues de sources
                publiquement accessibles (plateformes de vente, annonces, marketplaces).
              </p>
              <p className="mt-3">
                Pokéindex n’est affilié à aucune plateforme citée et n’intervient pas dans
                les transactions.
              </p>
            </Section>

            <Section title="Responsabilité" icon={<Icons.brain className="h-5 w-5 text-primary" />}>
              <p>
                Les informations fournies sur Pokéindex le sont à titre indicatif.
                Malgré le soin apporté à leur mise à jour, des erreurs ou variations
                peuvent subsister.
              </p>
              <p className="mt-3">
                Pokéindex ne saurait être tenu responsable des décisions d’achat, de vente
                ou d’investissement prises par l’utilisateur.
              </p>
            </Section>

            <Section title="Marques & affiliations" icon={<Icons.search className="h-5 w-5 text-primary" />}>
              <p>
                Pokémon est une marque déposée appartenant à Nintendo, Creatures Inc.
                et GAME FREAK Inc.
              </p>
              <p className="mt-3">
                Pokéindex est un projet indépendant, non officiel, sans lien contractuel
                ou commercial avec les ayants droit.
              </p>
            </Section>

            <Section title="Contact" icon={<Icons.search className="h-5 w-5 text-primary" />}>
              <p>
                Pour toute question légale ou demande d’information, vous pouvez nous
                contacter à l’adresse suivante :
              </p>
              <p className="mt-2 font-semibold">
                [contact@pokeindex.fr]
              </p>
            </Section>

            {/* CTA retour */}
            <div className="flex justify-center pt-4">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl font-semibold shadow-md
                  bg-gradient-to-r from-primary to-primary/80
                  hover:shadow-lg transition-all"
              >
                <Link href="/" aria-label="Retour à l'accueil">
                  Retour à l’accueil
                  <Icons.LineChart className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Pokéindex — Tous droits réservés
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-xl border border-border/60 bg-background/60 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{title}</h2>
          <div className="mt-3 text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
