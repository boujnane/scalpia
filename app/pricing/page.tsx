// app/pricing/page.tsx
'use client'

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useReducedMotion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useAuth } from "@/context/AuthContext"

type Billing = "monthly" | "yearly"

type Plan = {
  id: string
  name: string
  description: string
  badge?: string
  popular?: boolean
  priceMonthly: number | null
  priceYearly: number | null
  highlights: string[]
  cta: { label: string; href: string; variant?: "default" | "outline"; icon: keyof typeof Icons }
  featured?: boolean
}

type FAQ = { q: string; a: string }

type FeatureRow = {
  name: string
  free: boolean | string
  pro: boolean | string
  enterprise: boolean | string
}

export default function PricingPage() {
  const prefersReducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [billing, setBilling] = useState<Billing>("monthly")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const { user, isPro } = useAuth()
  const router = useRouter()

  useEffect(() => setMounted(true), [])
    
  const handleCheckout = async () => {
  if (!user) {
    router.push("/login?redirect=/pricing")
    return
  }

  // Si déjà pro => portail
  if (isPro) {
    await handlePortal()
    return
  }

  setCheckoutLoading(true)
  try {
    const token = await user.getIdToken()

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        interval: billing, // ✅ ton endpoint attend seulement interval
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error("Checkout API error:", response.status, data)
      throw new Error(data?.error || `API error ${response.status}`)
    }

    if (!data?.url) {
      throw new Error("No checkout URL returned")
    }

    window.location.assign(data.url)
  } catch (error) {
    console.error("Checkout error:", error)
    alert(`Une erreur est survenue : ${(error as Error).message}`)
  } finally {
    setCheckoutLoading(false)
  }
}


  const handlePortal = async () => {
  if (!user) return

  setCheckoutLoading(true)
  try {
    const token = await user.getIdToken()

    const response = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}), // ✅ inutile d'envoyer userId si le serveur lit le token
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error("Portal API error:", response.status, data)
      throw new Error(data?.error || `API error ${response.status}`)
    }

    if (!data?.url) {
      throw new Error("No portal URL returned")
    }

    window.location.assign(data.url)
  } catch (error) {
    console.error("Portal error:", error)
    alert(`Une erreur est survenue : ${(error as Error).message}`)
  } finally {
    setCheckoutLoading(false)
  }
}


  const plans: Plan[] = useMemo(
    () => [
      {
        id: "free",
        name: "Gratuit",
        badge: "Pour démarrer",
        description:
          "L'essentiel pour découvrir l'index et explorer la base avec un quota limité.",
        priceMonthly: 0,
        priceYearly: 0,
        highlights: [
          "15 jetons / jour",
          "Index + historique des prix (limité par jetons)",
          "Toutes les séries accessibles",
          "Analyse séries : données 7 jours",
          "Support communautaire",
        ],
        cta: { label: "Commencer gratuitement", href: "/analyse", variant: "outline", icon: "zap" },
      },
      {
        id: "pro",
        name: "Pro",
        badge: "Plus populaire",
        popular: true,
        description:
          "Pour une veille sérieuse : indicateurs avancés, alertes, exports et analyses pro.",
        priceMonthly: 9,
        priceYearly: 87,
        highlights: [
          "300 jetons / jour",
          "Tout le plan Gratuit",
          "Widgets avancés (sentiment, volatilité, signaux, risque/rendement)",
          "Analyse séries avancée (performance, risque, momentum)",
          "Données 7 jours + 30 jours",
          "Support prioritaire",
        ],
        cta: { label: "Passer en Pro", href: "/analyse", variant: "default", icon: "sparkles" },
        featured: true,
      },
      {
        id: "enterprise",
        name: "Entreprise",
        badge: "Sur mesure",
        description:
          "Pour pros / boutiques : quotas illimités, intégrations, SLA, accès API & reporting.",
        priceMonthly: null,
        priceYearly: null,
        highlights: [
          "Recherches illimitées",
          "Tout le plan Pro",
          "Accès API & intégrations",
          "Tableaux de bord personnalisés",
          "SLA & accompagnement dédié",
        ],
        cta: { label: "Nous contacter", href: "/contact", variant: "outline", icon: "barChart3" },
      },
    ],
    []
  )

  const comparisonFeatures: FeatureRow[] = useMemo(
    () => [
      { name: "Jetons / jour", free: "15", pro: "300", enterprise: "Illimité" },
      { name: "Historique des prix d'un item", free: "Limité par jetons", pro: "Limité par jetons", enterprise: true },
      { name: "Toutes les séries", free: true, pro: true, enterprise: true },
      { name: "Sentiment du marché", free: false, pro: true, enterprise: true },
      { name: "Volatilité du marché", free: false, pro: true, enterprise: true },
      { name: "Signaux actifs", free: false, pro: true, enterprise: true },
      { name: "Risque / rendement (graphique)", free: false, pro: true, enterprise: true },
      { name: "Analyse séries avancée", free: false, pro: true, enterprise: true },
      { name: "Fenêtre d'analyse", free: "7 jours", pro: "7 + 30 jours", enterprise: "7 + 30 jours" },
      { name: "Alertes de prix", free: false, pro: false, enterprise: true },
      { name: "Exports CSV", free: false, pro: false, enterprise: true },
      { name: "Accès API", free: false, pro: false, enterprise: true },
      { name: "Support", free: "Communautaire", pro: "Prioritaire", enterprise: "Dédié + SLA" },
    ],
    []
  )

  const faqs: FAQ[] = useMemo(
    () => [
      {
        q: "Comment fonctionnent les quotas de recherche ?",
        a: "Chaque recherche ou ouverture d'historique consomme 1 jeton. Le compteur se réinitialise chaque jour à minuit. Gratuit = 15/jour, Pro = 300/jour, Entreprise = illimité.",
      },
      {
        q: "Les prix sont-ils garantis ?",
        a: "Non. Pokéindex consolide des informations publiques et fournit des estimations indicatives au moment du relevé. Aucune garantie d'exactitude.",
      },
      {
        q: "Quelles plateformes sont incluses ?",
        a: "Cardmarket, eBay, Vinted et LeBonCoin. Les données peuvent varier selon disponibilité, catégories et accès public.",
      },
      {
        q: "Puis-je annuler à tout moment ?",
        a: "Oui. L'objectif est une facturation simple et sans friction. Ton accès reste actif jusqu'à la fin de la période en cours.",
      },
      {
        q: "Pro inclut quoi concrètement en plus ?",
        a: "20× plus de jetons (300/jour), widgets avancés (sentiment, volatilité, signaux, risque/rendement), analyse séries avancée (performance, risque, momentum) et données 30 jours.",
      },
    ],
    []
  )

  const fadeInUp = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.7 },
  }

  const priceLabel = (plan: Plan) => {
    if (plan.priceMonthly == null && plan.priceYearly == null) return "Sur devis"
    const v = billing === "monthly" ? plan.priceMonthly : plan.priceYearly
    if (v === 0) return "0€"
    if (v == null) return "Sur devis"
    return `${v}€`
  }

  const priceSuffix = (plan: Plan) => {
    if (plan.priceMonthly == null && plan.priceYearly == null) return ""
    const v = billing === "monthly" ? plan.priceMonthly : plan.priceYearly
    if (v === 0) return "/ mois"
    return billing === "monthly" ? "/ mois" : "/ an"
  }

  const yearlySavePct = () => {
    const pro = plans.find((p) => p.id === "pro")
    if (!pro?.priceMonthly || !pro?.priceYearly) return null
    // (monthly*12 - yearly) / (monthly*12)
    const full = pro.priceMonthly * 12
    const pct = Math.round(((full - pro.priceYearly) / full) * 100)
    return pct > 0 ? pct : null
  }

  const savePct = yearlySavePct()

  return (
    <>
      {/* Structured Data (SEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Tarifs — Pokéindex",
            description:
              "Tarifs Pokéindex : gratuit, pro et entreprise. Index des prix Pokémon scellés et analyses de tendances.",
            url: "https://votre-domaine.com/pricing",
          }),
        }}
      />

      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* HERO */}
        <section
          className="relative overflow-hidden border-b border-border/50"
          aria-labelledby="pricing-title"
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5"
            aria-hidden="true"
          />

          {!prefersReducedMotion && (
            <>
              <div
                className="absolute top-10 right-6 sm:top-20 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"
                aria-hidden="true"
              />
              <div
                className="absolute bottom-12 left-6 sm:bottom-20 sm:left-20 w-40 h-40 sm:w-80 sm:h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "1s" }}
                aria-hidden="true"
              />
            </>
          )}

          <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10 py-16 sm:py-20 lg:py-24">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div
                {...fadeInUp}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
                role="status"
                aria-live="polite"
              >
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span
                    className={
                      prefersReducedMotion
                        ? "absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
                        : "animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
                    }
                  />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="text-xs sm:text-sm font-semibold text-primary">
                  Tarifs simples · Sans engagement
                </span>
              </motion.div>

              <motion.h1
                id="pricing-title"
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.7, delay: prefersReducedMotion ? 0 : 0.08 }}
                className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08]"
              >
                Choisis l’offre adaptée à ta{" "}
                <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  veille Pokémon
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.7, delay: prefersReducedMotion ? 0 : 0.14 }}
                className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed"
              >
                Pokéindex consolide des données publiques (Cardmarket, eBay, Vinted, LeBonCoin) pour te donner une vision claire
                du marché secondaire. Les prix restent indicatifs.
              </motion.p>

              {/* Billing Toggle */}
              <motion.div
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: prefersReducedMotion ? 0 : 0.22 }}
                className="mt-8 flex items-center justify-center"
              >
                <div
                  className="inline-flex items-center gap-1 rounded-2xl bg-background/60 backdrop-blur-md border border-border/50 p-1 shadow-sm"
                  role="tablist"
                  aria-label="Choix de facturation"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={billing === "monthly"}
                    onClick={() => setBilling("monthly")}
                    className={[
                      "px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
                      billing === "monthly"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    ].join(" ")}
                  >
                    Mensuel
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={billing === "yearly"}
                    onClick={() => setBilling("yearly")}
                    className={[
                      "px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2",
                      billing === "yearly"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    ].join(" ")}
                  >
                    Annuel
                    {savePct && (
                      <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-300 border border-green-500/20">
                        -{savePct}%
                      </span>
                    )}
                  </button>
                </div>
              </motion.div>

              {/* micro trust row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: prefersReducedMotion ? 0 : 0.32 }}
                className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground"
              >
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/40">
                  <Icons.refreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Mise à jour quotidienne
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/40">
                  <Icons.search className="h-3.5 w-3.5" aria-hidden="true" />
                  Données publiques consolidées
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/40">
                  <Icons.zap className="h-3.5 w-3.5" aria-hidden="true" />
                  Sans affiliation marketplaces
                </span>
              </motion.div>
            </div>
          </div>
        </section>

        {/* PLANS */}
        <section className="py-14 sm:py-18 lg:py-20" aria-labelledby="plans-title">
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <h2 id="plans-title" className="sr-only">
              Offres et tarifs
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
              {plans.map((plan, idx) => {
                const isFeatured = !!plan.featured
                const IconComponent = Icons[plan.cta.icon]
                return (
                  <motion.article
                    key={plan.id}
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.65,
                      delay: prefersReducedMotion ? 0 : idx * 0.08,
                    }}
                    className={[
                      "relative rounded-2xl border backdrop-blur-md shadow-sm overflow-hidden",
                      "bg-background/60 border-border/50",
                      isFeatured
                        ? "ring-2 ring-primary shadow-xl lg:scale-105 z-10"
                        : "hover:border-primary/25 hover:shadow-md transition-all",
                    ].join(" ")}
                    aria-label={`Offre ${plan.name}`}
                  >
                    {/* Popular ribbon */}
                                        {plan.popular && (
                    <div className="pointer-events-none absolute right-[-56px] top-6 z-20 rotate-45">
                        <div className="w-48 bg-gradient-to-r from-primary to-purple-500  text-primary-foreground text-center text-[9.5px] leading-none
                                        font-extrabold tracking-widest uppercase py-1.25
                                        shadow-sm border border-primary/40">
                        Populaire
                        </div>
                    </div>
                    )}

                    {/* Featured glow */}
                    {!prefersReducedMotion && isFeatured && (
                      <div
                        className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-purple-500/15 to-pink-500/15 blur-2xl"
                        aria-hidden="true"
                      />
                    )}

                    <div className="p-6 sm:p-7 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                              {plan.name}
                            </h3>
                            {plan.badge && !plan.popular && (
                              <span
                                className={[
                                  "text-[10px] font-bold px-2 py-1 rounded-full border",
                                  isFeatured
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-muted/40 text-muted-foreground border-border/40",
                                ].join(" ")}
                              >
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                            {plan.description}
                          </p>
                        </div>

                        <div
                          className={[
                            "flex h-11 w-11 items-center justify-center rounded-xl border shrink-0",
                            isFeatured
                              ? "bg-primary/10 border-primary/20"
                              : "bg-muted/30 border-border/40",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          {plan.id === "free" ? (
                            <Icons.play className="h-5 w-5 text-primary" />
                          ) : plan.id === "pro" ? (
                            <Icons.trophy className="h-5 w-5 text-primary" />
                          ) : (
                            <Icons.building2 className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex items-baseline gap-2">
                          {/* Show crossed-out monthly price when yearly is selected */}
                          {billing === "yearly" && plan.priceMonthly !== null && plan.priceMonthly > 0 && (
                            <span className="text-lg text-muted-foreground line-through">
                              {plan.priceMonthly * 12}€
                            </span>
                          )}
                          <span className="text-4xl font-bold tracking-tight">
                            {priceLabel(plan)}
                          </span>
                          <span className="pb-1 text-sm text-muted-foreground">
                            {priceSuffix(plan)}
                          </span>
                        </div>

                        {plan.priceMonthly !== null && plan.priceMonthly > 0 && billing === "yearly" && savePct && (
                          <p className="mt-2 inline-flex items-center gap-1.5 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 font-semibold border border-green-500/20">
                              -{savePct}%
                            </span>
                            <span className="text-muted-foreground">soit {Math.round(plan.priceYearly! / 12)}€/mois</span>
                          </p>
                        )}
                      </div>

                      <ul className="mt-6 space-y-3 text-sm flex-1">
                        {plan.highlights.map((h) => (
                          <li key={h} className="flex items-start gap-2">
                            <span
                              className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20 shrink-0"
                              aria-hidden="true"
                            >
                              <Icons.check className="h-3.5 w-3.5 text-green-700 dark:text-green-300" />
                            </span>
                            <span className="text-muted-foreground leading-relaxed">
                              {h}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto pt-6 border-t border-border/40">
                        {plan.id === "pro" ? (
                          // Pro plan: Special checkout/portal button
                          <Button
                            size="lg"
                            variant={isPro ? "outline" : "default"}
                            disabled={checkoutLoading}
                            onClick={isPro ? handlePortal : handleCheckout}
                            className={[
                              "w-full h-12 rounded-xl font-semibold transition-all",
                              !isPro
                                ? "bg-gradient-to-r from-primary to-purple-600 shadow-md hover:shadow-lg hover:scale-[1.02]"
                                : "hover:scale-[1.01]",
                            ].join(" ")}
                            aria-label={isPro ? "Gérer mon abonnement" : plan.cta.label}
                          >
                            {checkoutLoading ? (
                              <>
                                <Icons.loader className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                                Chargement...
                              </>
                            ) : isPro ? (
                              <>
                                Gérer mon abonnement
                                <Icons.settings className="ml-2 h-4 w-4" aria-hidden="true" />
                              </>
                            ) : (
                              <>
                                {plan.cta.label}
                                <IconComponent className="ml-2 h-4 w-4" aria-hidden="true" />
                              </>
                            )}
                          </Button>
                        ) : (
                          // Free and Enterprise: Keep original Link behavior
                          <Button
                            asChild
                            size="lg"
                            variant={plan.cta.variant ?? "default"}
                            className={[
                              "w-full h-12 rounded-xl font-semibold transition-all",
                              isFeatured
                                ? "bg-gradient-to-r from-primary to-purple-600 shadow-md hover:shadow-lg hover:scale-[1.02]"
                                : "hover:scale-[1.01]",
                            ].join(" ")}
                            aria-label={plan.cta.label}
                          >
                            <Link href={plan.cta.href}>
                              {plan.cta.label}
                              <IconComponent className="ml-2 h-4 w-4" aria-hidden="true" />
                            </Link>
                          </Button>
                        )}

                        <p className="mt-3 text-[11px] text-muted-foreground/80 text-center leading-relaxed">
                          {plan.id === "enterprise"
                            ? "Réponse sous 48h ouvrées. Proposition sur mesure."
                            : plan.id === "pro" && isPro
                            ? "Gérez votre abonnement via le portail Stripe."
                            : "Accès immédiat. Annulation à tout moment."}
                        </p>
                      </div>
                    </div>
                  </motion.article>
                )
              })}
            </div>

            {/* Legal note */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
              className="mt-10 text-center"
            >
              <p className="mx-auto max-w-4xl text-[11px] leading-relaxed text-muted-foreground/75">
                <strong className="text-foreground/90">Note :</strong> Pokéindex est un outil d'observation indépendant.
                Les marques et plateformes citées appartiennent à leurs détenteurs respectifs. Les prix affichés sont
                indicatifs et peuvent varier.
              </p>
            </motion.div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="py-14 sm:py-18 bg-muted/5" aria-labelledby="comparison-title">
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
              className="text-center mb-10"
            >
              <h2 id="comparison-title" className="text-2xl sm:text-3xl font-bold tracking-tight">
                Comparatif des fonctionnalités
              </h2>
              <p className="mt-2 text-muted-foreground">
                Trouve l'offre qui correspond à tes besoins
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.1 }}
              className="overflow-x-auto"
            >
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="py-4 px-4 text-left text-sm font-semibold text-foreground">Fonctionnalité</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold text-foreground">Gratuit</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold text-primary bg-primary/5 rounded-t-xl">Pro</th>
                    <th className="py-4 px-4 text-center text-sm font-semibold text-foreground">Entreprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, i) => (
                    <tr key={feature.name} className={i % 2 === 0 ? "bg-muted/20" : ""}>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{feature.name}</td>
                      <td className="py-3 px-4 text-center">
                        {typeof feature.free === "boolean" ? (
                          feature.free ? (
                            <Icons.check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                          ) : (
                            <Icons.minus className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">{feature.free}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center bg-primary/5">
                        {typeof feature.pro === "boolean" ? (
                          feature.pro ? (
                            <Icons.check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                          ) : (
                            <Icons.minus className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm font-medium text-primary">{feature.pro}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {typeof feature.enterprise === "boolean" ? (
                          feature.enterprise ? (
                            <Icons.check className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                          ) : (
                            <Icons.minus className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">{feature.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative border-y border-border/50 bg-muted/10 py-16 sm:py-20" aria-labelledby="faq-title">
          <div
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,var(--tw-gradient-from)_0%,transparent_70%)] from-primary/5 opacity-50"
            aria-hidden="true"
          />
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 id="faq-title" className="text-3xl sm:text-4xl font-bold tracking-tight">
                Questions fréquentes
              </h2>
              <p className="mt-3 text-muted-foreground">
                Transparence totale : ce que Pokéindex fait… et ne fait pas.
              </p>
            </motion.div>

            <div className="mt-10 max-w-3xl mx-auto space-y-3">
              {faqs.map((f, i) => {
                const isOpen = openFaq === i
                return (
                  <motion.div
                    key={f.q}
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: prefersReducedMotion ? 0 : i * 0.05 }}
                    className="rounded-2xl bg-background/60 backdrop-blur-md border border-border/50 shadow-sm overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-muted/30 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0"
                          aria-hidden="true"
                        >
                          <Icons.helpCircle className="h-4 w-4 text-primary" />
                        </span>
                        <h3 className="text-sm sm:text-base font-semibold">{f.q}</h3>
                      </div>
                      <Icons.chevronDown
                        className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden="true"
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="px-5 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed pl-[4.25rem]">
                            {f.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-18 sm:py-22 lg:py-24 overflow-hidden" aria-labelledby="cta-title">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" aria-hidden="true" />
          <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10 py-16 sm:py-20">
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.65 }}
              className="max-w-4xl mx-auto text-center rounded-3xl border border-border/50 bg-background/60 backdrop-blur-md shadow-lg p-8 sm:p-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-secondary text-secondary-foreground">
                <Icons.refreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-sm font-medium">Index mis à jour quotidiennement</span>
              </div>

              <h2 id="cta-title" className="mt-6 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Prêt(e) à suivre la cote{" "}
                <span className="text-primary">sans bruit</span> ?
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Commence gratuitement, puis passe en Pro quand tu veux pour les alertes, exports et analyses avancées.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="h-12 px-8 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/70 shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
                  aria-label="Accéder à l'index des prix"
                >
                  <Link href="/analyse">
                    <Icons.barChart3 className="mr-2 h-5 w-5" aria-hidden="true" />
                    Consulter l’index
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 rounded-xl font-semibold hover:scale-[1.01] transition-all"
                  aria-label="Explorer la base de cartes"
                >
                  <Link href="/cartes">
                    <Icons.search className="mr-2 h-5 w-5" aria-hidden="true" />
                    Explorer la base
                  </Link>
                </Button>
              </div>

              <p className="mt-6 text-xs text-muted-foreground/70">
                Données agrégées à titre indicatif. Nous ne sommes pas affiliés aux plateformes citées.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  )
}
