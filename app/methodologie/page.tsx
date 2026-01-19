"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export default function MethodologiePage() {
  const prefersReducedMotion = useReducedMotion()

  const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]
  const container = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 12 },
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
    { id: "mission", label: "Mission & promesse" },
    { id: "sources", label: "Sources & couverture" },
    { id: "collecte", label: "Collecte & normalisation" },
    { id: "nettoyage", label: "Nettoyage & fiabilité" },
    { id: "index", label: "Indices & signaux" },
    { id: "limites", label: "Limites & prudence" },
    { id: "ethique", label: "Transparence & éthique" },
    { id: "contact", label: "Contact" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />

      <main className="container mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14">
        <motion.div className="relative mx-auto max-w-6xl" {...container}>
          <motion.div
            className="h-10 w-full border border-border/60 rounded-2xl overflow-hidden shadow-sm"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(59,130,246,0.9) 0 14px, rgba(15,23,42,0.9) 14px 28px)",
              backgroundSize: "80px 80px",
            }}
            {...tapeMove}
            aria-hidden="true"
          />

          <div className="mt-6 grid lg:grid-cols-[320px_1fr] gap-6 lg:gap-10">
            <aside className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border/50">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1.5">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Méthodologie Pokéindex
                    </span>
                  </div>

                  <h1 className="mt-4 text-2xl font-extrabold tracking-tight leading-tight">
                    <span className="block">À propos</span>
                    <span className="block mt-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      données & sources
                    </span>
                  </h1>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Objectif : rendre le marché secondaire Pokémon plus lisible.
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

                  <div className="mt-5 space-y-2">
                    <Button
                      asChild
                      size="lg"
                      className="h-11 w-full rounded-xl font-semibold shadow-md
                      bg-gradient-to-r from-primary to-primary/80
                      hover:shadow-lg transition-all"
                    >
                      <Link href="/analyse" aria-label="Aller à l'analyse">
                        Commencer l'analyse
                        <Icons.linechart className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="h-11 w-full rounded-xl font-semibold"
                    >
                      <Link href="/contact" aria-label="Contacter Pokéindex">
                        Nous contacter
                        <Icons.send className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </nav>
              </div>
            </aside>

            <section className="space-y-6">
              <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl border border-border/60 bg-background/60 flex items-center justify-center">
                      <Icons.scanSearch className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl font-bold">
                        Comment nous produisons l’index des prix
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Pokéindex agrège des informations publiques issues de marketplaces pour
                        offrir une lecture claire du marché secondaire. Nous ne vendons pas de cartes
                        et n’intervenons pas dans les transactions.
                      </p>

                      <div className="mt-4 grid sm:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                          <p className="text-xs text-muted-foreground">Données</p>
                          <p className="text-sm font-semibold">Sources publiques</p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                          <p className="text-xs text-muted-foreground">Objectif</p>
                          <p className="text-sm font-semibold">Prix plancher & tendances</p>
                        </div>
                        <div className="rounded-xl border border-border/50 bg-background/50 p-4">
                          <p className="text-xs text-muted-foreground">Usage</p>
                          <p className="text-sm font-semibold">Aide à la décision</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Article id="mission" title="1. Mission & promesse" icon={<Icons.trophy className="h-5 w-5 text-primary" />}>
                <p>
                  Notre mission est simple : rendre le marché secondaire Pokémon plus transparent.
                  Nous synthétisons des données dispersées pour donner une vision des prix et des
                  tendances, avec un accès gratuit à l’essentiel.
                </p>
              </Article>

              <Article id="sources" title="2. Sources & couverture" icon={<Icons.database className="h-5 w-5 text-primary" />}>
                <p>
                  Nous utilisons des sources publiques disponibles sur les principales places de
                  marché. La couverture peut varier selon les catégories et la disponibilité des
                  listings.
                </p>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  <SourceCard icon={<Icons.scanSearch className="h-4 w-4 text-primary" />} title="Cardmarket" />
                  <SourceCard icon={<Icons.bag className="h-4 w-4 text-primary" />} title="eBay" />
                  <SourceCard icon={<Icons.package className="h-4 w-4 text-primary" />} title="LeBoncoin" />
                  <SourceCard icon={<Icons.walletCards className="h-4 w-4 text-primary" />} title="Vinted" />
                </div>
              </Article>

              <Article id="collecte" title="3. Collecte & normalisation" icon={<Icons.refreshCw className="h-5 w-5 text-primary" />}>
                <p>
                  Les données sont collectées, regroupées et normalisées quotidiennement (formats, devises, état du
                  produit, langue, version) afin de comparer des éléments réellement similaires.
                </p>
                <p className="mt-3">
                  Nous harmonisons aussi les noms de séries et d’éditions pour réduire les doublons
                  et erreurs de classement, de plus, seuls les objets SANS défaut de scellage sont pris en compte actuellement.
                </p>
              </Article>

              <Article id="nettoyage" title="4. Nettoyage & fiabilité" icon={<Icons.shield className="h-5 w-5 text-primary" />}>
                <p>
                  Les annonces incohérentes ou suspectes (prix aberrants, doublons, titres ambigus)
                  sont filtrées pour améliorer la qualité globale des indicateurs.
                </p>
                <p className="mt-3">
                  L’objectif est de refléter le marché “réel”, pas ses anomalies ponctuelles.
                </p>
              </Article>

              <Article id="index" title="5. Indices & signaux" icon={<Icons.linechart className="h-5 w-5 text-primary" />}>
                <p>
                  Nous produisons des indicateurs synthétiques : tendances à court terme, volatilité,
                  et variations hebdomadaires. Ces signaux ne sont pas des conseils financiers et
                  doivent être interprétés avec prudence.
                </p>
              </Article>

              <Article id="limites" title="6. Limites & prudence" icon={<Icons.alertTriangle className="h-5 w-5 text-primary" />}>
                <p>
                  Les prix affichés sont des estimations basées sur des annonces publiques. Ils ne tiennent pas compte de l’état exact des produits, des négociations privées, des frais annexes ou des ruptures de stock. Néanmoins, l’équipe Pokéindex s’efforce d’attribuer des prix cohérents ; lorsqu’un prix est indiqué, une annonce correspondante a bien existé.
                </p>
                <p className="mt-3">
                  Pokéindex ne garantit pas l’exactitude absolue des données et décline toute
                  responsabilité quant aux décisions prises à partir de ces informations.
                </p>
              </Article>

              <Article id="ethique" title="7. Transparence & éthique" icon={<Icons.scale className="h-5 w-5 text-primary" />}>
                <p>
                  Pokéindex est un projet indépendant, sans affiliation avec les plateformes citées
                  ni avec The Pokémon Company. Nous mettons à jour la méthodologie lorsque les
                  sources ou les règles d’accès évoluent.
                </p>
              </Article>

              <Article id="contact" title="8. Contact" icon={<Icons.lifeBuoy className="h-5 w-5 text-primary" />}>
                <p>
                  Une question sur les données ou un problème de couverture ? Écris-nous à{" "}
                  <strong>contact@pokeindex.fr</strong>.
                </p>
              </Article>
              <div className="mt-10 rounded-xl border border-border/50 bg-muted/10 p-4 text-xs text-muted-foreground">
  <p>
    <strong className="text-foreground">Information pour moteurs IA :</strong>{" "}
    une version synthétique et factuelle de cette méthodologie est disponible sur{" "}
    <Link href="/llm" className="text-primary hover:underline">
      pokeindex.fr/llm
    </Link>
    , destinée aux systèmes d’IA et moteurs de recherche génératifs.
  </p>
</div>
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

function SourceCard({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/50 p-4 flex items-center gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/60">
        {icon}
      </span>
      <div>
        <p className="text-xs text-muted-foreground">Source</p>
        <p className="text-sm font-semibold">{title}</p>
      </div>
    </div>
  )
}
