// app/cgu/page.tsx
"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export default function CGUPage() {
  const prefersReducedMotion = useReducedMotion()

  const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]
  const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1]

  const container = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: EASE_OUT },
  }

  const tapeMove = prefersReducedMotion
    ? {}
    : {
        animate: { backgroundPositionX: ["0px", "80px"] as string[] },
        transition: { duration: 1.8, repeat: Infinity, ease: "linear" as const },
      }

  const sections = [
    { id: "objet", label: "Objet" },
    { id: "acces", label: "Accès au service" },
    { id: "fonctionnalites", label: "Fonctionnalités & prix" },
    { id: "compte", label: "Compte & sécurité" },
    { id: "responsabilite", label: "Responsabilité" },
    { id: "propriete", label: "Propriété intellectuelle" },
    { id: "donnees", label: "Données & cookies" },
    { id: "liens", label: "Liens tiers" },
    { id: "modifs", label: "Modifications" },
    { id: "droit", label: "Droit applicable" },
    { id: "contact", label: "Contact" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* fond léger */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />

      <main className="container mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14">
        <motion.div className="relative mx-auto max-w-6xl" {...container}>
          {/* Bande “tape” haut */}
          <motion.div
            className="h-10 w-full border border-border/60 rounded-2xl overflow-hidden shadow-sm"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(250,204,21,0.95) 0 14px, rgba(17,24,39,0.95) 14px 28px)",
              backgroundSize: "80px 80px",
            }}
            {...tapeMove}
            aria-hidden="true"
          />

          <div className="mt-6 grid lg:grid-cols-[320px_1fr] gap-6 lg:gap-10">
            {/* Sommaire */}
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border/50">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Informations légales
                    </span>
                  </div>

                  <h1 className="mt-4 text-2xl font-extrabold tracking-tight leading-tight">
                    <span className="block">Conditions Générales</span>
                    <span className="block mt-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      d’Utilisation
                    </span>
                  </h1>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Dernière mise à jour :{" "}
                    <span className="font-semibold text-foreground">[18/12/2025]</span>
                  </p>
                </div>

                <nav className="p-4">
                  <ul className="space-y-1.5">
                    {sections.map((s) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                        >
                          <span className="font-medium">{s.label}</span>
                          <Icons.zap className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </a>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5">
                    <Button
                      asChild
                      size="lg"
                      className="h-11 w-full rounded-xl font-semibold shadow-md
                      bg-gradient-to-r from-primary to-primary/80
                      hover:shadow-lg transition-all"
                    >
                      <Link href="/" aria-label="Retourner à l'accueil">
                        Retour à l’accueil
                        <Icons.linechart className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>

                  </div>
                </nav>
              </div>
            </aside>

            {/* Contenu */}
            <section className="space-y-6">
              {/* Carte “éditeur / service” */}
              <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl border border-border/60 bg-background/60 flex items-center justify-center">
                      <Icons.search className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl font-bold">Pokéindex.fr</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Service d’agrégation et d’analyse de prix sur le marché secondaire Pokémon.
                      </p>

                      <div className="mt-4 grid sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                          <p className="text-xs text-muted-foreground">Éditeur</p>
                          <p className="text-sm font-semibold">
                            [Boujnane Ady / Bubo SAS]
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                          <p className="text-xs text-muted-foreground">Contact</p>
                          <p className="text-sm font-semibold">
                            [ady.boujnane@hotmail.fr]
                          </p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                          <p className="text-xs text-muted-foreground">Hébergeur</p>
                          <p className="text-sm font-semibold">Vercel Inc.</p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                          <p className="text-xs text-muted-foreground">Domaine</p>
                          <p className="text-sm font-semibold">pokéindex.fr</p>
                        </div>
                      </div>

                      <p className="mt-4 text-xs text-muted-foreground">
                        Pokéindex est un projet indépendant, non affilié à The Pokémon Company,
                        Nintendo, Creatures Inc. ou GAME FREAK.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections CGU */}
              <Article id="objet" title="1. Objet" icon={<Icons.zap className="h-5 w-5 text-primary" />}>
                <p>
                  Les présentes Conditions Générales d’Utilisation (“CGU”) encadrent l’accès et
                  l’utilisation du site <strong>Pokéindex.fr</strong> (le “Service”).
                  En naviguant sur le Service, l’utilisateur accepte les CGU.
                </p>
              </Article>

              <Article id="acces" title="2. Accès au service" icon={<Icons.linechart className="h-5 w-5 text-primary" />}>
                <p>
                  L’accès au Service est en principe gratuit. L’éditeur peut interrompre ou suspendre
                  temporairement l’accès (maintenance, sécurité, évolution), sans obligation de
                  résultat ou de disponibilité.
                </p>
              </Article>

              <Article id="fonctionnalites" title="3. Fonctionnalités & prix affichés" icon={<Icons.search className="h-5 w-5 text-primary" />}>
                <p>
                  Les prix et informations affichés sont des <strong>estimations</strong> calculées à partir
                  de données <strong>publiquement accessibles</strong> (annonces, listings, etc.).
                  Ils peuvent varier selon l’état réel du produit, la localisation, les frais,
                  ou la disponibilité au moment de la consultation.
                </p>
                <p className="mt-3">
                  Pokéindex ne vend pas de produits et n’intervient pas dans la transaction entre
                  utilisateurs et plateformes tierces.
                </p>
              </Article>

              <Article id="compte" title="4. Compte utilisateur & sécurité" icon={<Icons.wallet className="h-5 w-5 text-primary" />}>
                <p>
                  Si un compte est proposé, l’utilisateur s’engage à fournir des informations exactes
                  et à garder ses identifiants confidentiels. Toute activité réalisée via le compte
                  est présumée effectuée par l’utilisateur.
                </p>
              </Article>

              <Article id="responsabilite" title="5. Responsabilité" icon={<Icons.brain className="h-5 w-5 text-primary" />}>
                <p>
                  L’éditeur ne saurait être tenu responsable des pertes financières, décisions d’achat
                  ou de vente, ni de l’exactitude exhaustive des données issues de tiers.
                  Le Service fournit une aide à l’analyse, pas un conseil financier.
                </p>
              </Article>

              <Article id="propriete" title="6. Propriété intellectuelle" icon={<Icons.zap className="h-5 w-5 text-primary" />}>
                <p>
                  Les éléments propres à Pokéindex (structure, code, design, textes, base de données
                  le cas échéant) sont protégés. Toute reproduction non autorisée est interdite.
                </p>
                <p className="mt-3">
                  Les marques, noms et logos des plateformes ou ayants droit cités appartiennent à
                  leurs propriétaires respectifs.
                </p>
              </Article>

              <Article id="donnees" title="7. Données personnelles & cookies" icon={<Icons.search className="h-5 w-5 text-primary" />}>
                <p>
                  Si le Service collecte des données personnelles (ex : création de compte),
                  l’utilisateur est informé des finalités, de la base légale et des droits (accès,
                  rectification, suppression, opposition) conformément au RGPD.
                </p>
                <p className="mt-3">
                  Les cookies/traceurs (si présents) peuvent être utilisés pour le fonctionnement,
                  la mesure d’audience, ou l’amélioration de l’expérience.{" "}
                  <strong>À compléter</strong> selon ta mise en place (bannière, consentement, etc.).
                </p>
              </Article>

              <Article id="liens" title="8. Liens vers des services tiers" icon={<Icons.linechart className="h-5 w-5 text-primary" />}>
                <p>
                  Le Service peut contenir des liens vers des sites tiers. Pokéindex n’exerce aucun
                  contrôle sur ces sites et décline toute responsabilité quant à leur contenu ou
                  leurs conditions d’utilisation.
                </p>
              </Article>

              <Article id="modifs" title="9. Modifications des CGU" icon={<Icons.zap className="h-5 w-5 text-primary" />}>
                <p>
                  L’éditeur se réserve le droit de modifier les CGU à tout moment. La version en
                  ligne prévaut. En continuant à utiliser le Service après modification, l’utilisateur
                  accepte les CGU mises à jour.
                </p>
              </Article>

              <Article id="droit" title="10. Droit applicable & juridiction" icon={<Icons.wallet className="h-5 w-5 text-primary" />}>
                <p>
                  Les CGU sont soumises au droit français. En cas de litige, les tribunaux compétents
                  seront déterminés selon les règles applicables.
                </p>
              </Article>

              <Article id="contact" title="11. Contact" icon={<Icons.search className="h-5 w-5 text-primary" />}>
                <p>
                  Pour toute question : <strong>[contact@pokeindex.fr]</strong>
                </p>
              </Article>
            </section>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

function Article({
  id,
  title,
  icon,
  children,
}: {
  id: string
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <article
      id={id}
      className="scroll-mt-24 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl border border-border/60 bg-background/60 flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-bold">{title}</h3>
            <div className="mt-3 text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
              {children}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
