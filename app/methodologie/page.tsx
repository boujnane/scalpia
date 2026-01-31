"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export default function MethodologiePage() {
  const prefersReducedMotion = useReducedMotion()

  const sources = [
    { name: "Cardmarket", emoji: "🏪", stat: "Référence EU", color: "bg-cardmarket" },
    { name: "eBay", emoji: "🛒", stat: "Mondial", color: "bg-ebay" },
    { name: "LeBoncoin", emoji: "📦", stat: "France", color: "bg-leboncoin" },
    { name: "Vinted", emoji: "👕", stat: "Montante", color: "bg-vinted" },
  ]

  const timelineSteps = [
    {
      id: "collect",
      title: "Collecte",
      subtitle: "Veille quotidienne",
      desc: "Nos agents parcourent les marketplaces chaque jour pour capturer les annonces actives.",
      icon: <Icons.refreshCw className="h-5 w-5" />,
    },
    {
      id: "normalize",
      title: "Normalisation",
      subtitle: "Harmonisation des données",
      desc: "Langue, édition, état, devise — tout est standardisé pour comparer ce qui est comparable.",
      icon: <Icons.database className="h-5 w-5" />,
    },
    {
      id: "filter",
      title: "Filtrage",
      subtitle: "Nettoyage intelligent",
      desc: "Prix aberrants, doublons, incohérences — on élimine le bruit pour garder le signal.",
      icon: <Icons.shield className="h-5 w-5" />,
    },
    {
      id: "index",
      title: "Index",
      subtitle: "Analyse & tendances",
      desc: "Prix plancher, médiane, volatilité — des indicateurs fiables pour éclairer vos décisions.",
      icon: <Icons.linechart className="h-5 w-5" />,
    },
  ]

  return (
    <>
      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.pokeindex.fr" },
              { "@type": "ListItem", position: 2, name: "Méthodologie" },
            ],
          }),
        }}
      />
      {/* Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Méthodologie Pokéindex - Collecte et analyse des prix",
            description: "Comment Pokéindex collecte, normalise et analyse les prix du marché Pokémon scellé depuis Cardmarket, eBay, Vinted et LeBonCoin.",
            author: { "@type": "Organization", name: "Pokéindex", url: "https://www.pokeindex.fr" },
            publisher: {
              "@type": "Organization",
              name: "Pokéindex",
              logo: { "@type": "ImageObject", url: "https://www.pokeindex.fr/logo/logo_pki.png" },
            },
            datePublished: "2024-01-01",
            dateModified: "2026-01-28",
            mainEntityOfPage: "https://www.pokeindex.fr/methodologie",
            articleSection: "Documentation",
            keywords: ["méthodologie", "prix pokémon", "analyse marché", "collecte données", "cardmarket", "ebay", "vinted", "leboncoin"],
          }),
        }}
      />
      {/* HowTo Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "Comment Pokéindex calcule les prix du marché Pokémon",
            description: "Les 4 étapes de notre méthodologie pour fournir des prix fiables",
            step: [
              { "@type": "HowToStep", position: 1, name: "Collecte", text: "Veille quotidienne sur les marketplaces (Cardmarket, eBay, Vinted, LeBonCoin)" },
              { "@type": "HowToStep", position: 2, name: "Normalisation", text: "Harmonisation des données (langue, édition, état, devise)" },
              { "@type": "HowToStep", position: 3, name: "Filtrage", text: "Élimination des prix aberrants, doublons et incohérences" },
              { "@type": "HowToStep", position: 4, name: "Index", text: "Calcul des indicateurs : prix plancher, médiane, volatilité, tendances" },
            ],
          }),
        }}
      />
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Méthodologie
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]"
            >
              <span className="block">Du chaos</span>
              <span className="block mt-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                à la clarté
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Comment on transforme des milliers d'annonces éparpillées
              en un index de prix lisible et fiable.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-16"
            >
              <motion.div
                animate={prefersReducedMotion ? {} : { y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-flex flex-col items-center gap-2 text-muted-foreground/50"
              >
                <span className="text-xs uppercase tracking-widest">Scroll</span>
                <Icons.chevronDown className="h-4 w-4" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BENTO GRID */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-16 text-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Nos sources
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              4 marketplaces scrutées quotidiennement
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
            {/* Main card - Mission */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="col-span-2 row-span-2 relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
              <div className="relative h-full rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 sm:p-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl" />
                <div className="relative z-10 h-full flex flex-col">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
                    <Icons.trophy className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                    Notre mission
                  </h3>
                  <p className="text-muted-foreground leading-relaxed flex-1">
                    Rendre le marché secondaire Pokémon <strong className="text-foreground">lisible</strong> et{" "}
                    <strong className="text-foreground">accessible</strong>. Sans vendre de cartes.
                    Sans commission. Sans bullshit.
                  </p>
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <p className="text-2xl font-bold text-primary">100%</p>
                        <p className="text-muted-foreground">Gratuit</p>
                      </div>
                      <div className="h-8 w-px bg-border/50" />
                      <div>
                        <p className="text-2xl font-bold text-primary">24h</p>
                        <p className="text-muted-foreground">Refresh</p>
                      </div>
                      <div className="h-8 w-px bg-border/50" />
                      <div>
                        <p className="text-2xl font-bold text-primary">4</p>
                        <p className="text-muted-foreground">Sources</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Source cards */}
            {sources.map((source, i) => (
              <motion.div
                key={source.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group relative"
              >
                <div className="relative h-full rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 sm:p-6 overflow-hidden hover:border-primary/30 transition-all duration-300">
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${source.color} opacity-50 group-hover:opacity-100 transition-opacity`} />
                  <span className="text-3xl sm:text-4xl">{source.emoji}</span>
                  <h4 className="mt-3 font-semibold">{source.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{source.stat}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-20 sm:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

        <div className="container mx-auto px-4 sm:px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mb-20 text-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Le processus
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              4 étapes, chaque jour, pour transformer le bruit en signal
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto relative">
            <div className="absolute left-8 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden sm:block" />

            {timelineSteps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`relative flex items-center gap-8 mb-16 last:mb-0 ${
                  i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                }`}
              >
                <div className={`flex-1 ${i % 2 === 0 ? "sm:text-right" : "sm:text-left"}`}>
                  <div className={`inline-block rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 sm:p-8 ${
                    i % 2 === 0 ? "sm:ml-auto" : "sm:mr-auto"
                  }`}>
                    <div className={`flex items-center gap-3 mb-4 ${i % 2 === 0 ? "sm:justify-end" : ""}`}>
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        {step.icon}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">{step.subtitle}</p>
                        <h3 className="text-xl font-bold">{step.title}</h3>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base max-w-sm">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-primary shadow-lg shadow-primary/50" />

                <div className="flex-1 hidden sm:flex items-center justify-center">
                  <span className="text-8xl font-black text-primary/10">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FILTRAGE */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-5xl mx-auto"
          >
            <div className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="p-8 sm:p-12 lg:p-16">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs uppercase tracking-wider text-muted-foreground mb-6">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Qualité des données
                  </span>

                  <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                    Ce qu'on garde,
                    <br />
                    <span className="text-muted-foreground">ce qu'on jette</span>
                  </h2>

                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    Une Display "Évolutions Célestes" à 150 € sur LeBoncoin ?
                    Prix aberrant, annonce trompeuse ou déjà obsolète. Dans les deux cas, ça fausse le prix plancher.
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <Icons.check className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-green-500">On garde</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Annonces cohérentes, prix dans les fourchettes observées, titres identifiables, si le prix semble bas mais que le vendeur le confirme alors nous le validons
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                      <Icons.close className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-red-500">On filtre</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Prix aberrants, prix hors marché sans réponse du vendeur, doublons, défauts de scellage, titres ambigus
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 sm:p-12 lg:p-16 bg-muted/30 flex items-center justify-center">
                  <div className="w-full max-w-xs space-y-6">
                    <div className="text-center mb-8">
                      <p className="text-sm text-muted-foreground mb-2">Taux de rétention</p>
                      <motion.p
                        className="text-6xl font-black text-primary"
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, type: "spring" }}
                      >
                        ~65%
                      </motion.p>
                      <p className="text-xs text-muted-foreground mt-2">des annonces dans l'index final</p>
                    </div>

                    {[
                      { label: "Collectées", value: 100, color: "bg-muted-foreground/30" },
                      { label: "Normalisées", value: 85, color: "bg-primary/50" },
                      { label: "Index final", value: 65, color: "bg-primary" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15 }}
                      >
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">{item.value}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${item.color}`}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.value}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.3 + i * 0.15, ease: "easeOut" }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LIMITES */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8 sm:p-12">
              <div className="flex items-start gap-6">
                <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
                  <Icons.alertTriangle className="h-8 w-8" />
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                    Ce qu'on ne peut pas faire
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Nos données ont des limites. On ne prétend pas avoir la vérité absolue.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { title: "L'état exact", desc: "Bien que les annonces soient vérifiées visuellement afin d'identifier d'éventuels défauts, il ne nous est pas possible de vérifer physiquement chaque produit" },
                      { title: "Les deals privés", desc: "Négociations en DM, échanges entre collectionneurs" },
                      { title: "Les frais annexes", desc: "Livraison, assurance, (la protection acheteur est incluse dans les prix pour vinted)" },
                      { title: "Les conseils d'achat", desc: "On donne des indicateurs, pas des recommandations" },
                    ].map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-background/50"
                      >
                        <span className="text-amber-500 mt-0.5 shrink-0">→</span>
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ÉTHIQUE */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                icon: <Icons.scale className="h-6 w-6" />,
                title: "Indépendance totale",
                desc: "Pas affilié aux marketplaces, pas de commission sur les ventes. Notre seul intérêt : des données justes.",
              },
              {
                icon: <Icons.refreshCw className="h-6 w-6" />,
                title: "Méthodologie évolutive",
                desc: "Les sources changent, les règles évoluent. Quand un biais apparaît, on adapte. Cette page sera mise à jour.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 hover:border-primary/30 transition-colors"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 p-12 sm:p-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-8">
                <Icons.lifeBuoy className="h-8 w-8" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Une question ?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Incohérence repérée, produit manquant, ou simple curiosité — on répond.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="rounded-xl h-12 px-8">
                  <Link href="/contact">
                    Nous contacter
                    <Icons.send className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl h-12 px-8">
                  <Link href="/analyse">
                    Explorer l'index
                    <Icons.arrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LLM Note */}
      <div className="container mx-auto px-4 sm:px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-xs text-muted-foreground text-center">
            <strong className="text-foreground">Pour les moteurs IA :</strong>{" "}
            version synthétique sur{" "}
            <Link href="/llm" className="text-primary hover:underline">
              pokeindex.fr/llm
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
