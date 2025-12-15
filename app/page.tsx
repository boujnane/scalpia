// app/page.tsx
'use client'

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { motion, useReducedMotion } from "framer-motion"
import { useState, useEffect } from "react"

export default function HomePage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const features = [
    {
      icon: Icons.search,
      title: "Recherche Multi-Plateformes",
      description: "Comparez les prix des produits scellés sur Cardmarket, eBay, LeBonCoin et Vinted en temps réel. Trouvez les meilleures offres instantanément.",
      href: "/recherche",
      // UTILISATION DE primary
      gradient: "from-primary/10 to-primary/5", 
      iconColor: "text-primary",
      borderColor: "border-primary/20",
      badge: "Comparateur",
      ariaLabel: "Accéder à l'outil de recherche multi-plateformes"
    },
    {
      icon: Icons.LineChart,
      title: "Analyse de Marché",
      description: "Visualisez l'évolution des prix des produits scellés depuis leur sortie. Identifiez les tendances et opportunités d'investissement.",
      href: "/analyse",
      // UTILISATION DE secondary/muted (pour un look plus doux)
      gradient: "from-muted-foreground/10 to-muted-foreground/5",
      iconColor: "text-muted-foreground",
      borderColor: "border-muted-foreground/20",
      badge: "Analytics",
      ariaLabel: "Accéder aux analyses de marché"
    },
    {
      icon: Icons.zap,
      title: "Base de Cartes TCGdex",
      description: "Explorez toutes les cartes Pokémon grâce à l'API TCGdex. Recherche instantanée, détails complets et images haute résolution.",
      href: "/tcgdex",
      // UTILISATION DE accent
      gradient: "from-accent/10 to-accent/5",
      iconColor: "text-accent", // ATTENTION: Vous devrez définir la classe text-accent
      borderColor: "border-accent/20", // ATTENTION: Vous devrez définir la classe border-accent
      badge: "Database",
      ariaLabel: "Explorer la base de données TCGdex"
    },
  ]

  const platforms = [
    { name: "eBay", icon: "🛒", color: "from-ebay to-ebay-soft", mobileColor: "bg-ebay-soft", ariaLabel: "eBay" },
    { name: "Cardmarket", icon: "🏪", color: "from-cardmarket to-cardmarket-soft", mobileColor: "bg-cardmarket-soft", ariaLabel: "Cardmarket" },
    { name: "LeBoncoin", icon: "📦", color: "from-leboncoin to-leboncoin-soft", mobileColor: "bg-leboncoin-soft", ariaLabel: "LeBonCoin" },
    { name: "Vinted", icon: "👕", color: "from-vinted to-vinted-soft", mobileColor: "bg-vinted-soft", ariaLabel: "Vinted" },
  ]

  const stats = [
    { value: "3", label: "Plateformes Connectées", icon: Icons.search },
    { value: "100K+", label: "Cartes Référencées", icon: Icons.zap },
    { value: "Temps réel", label: "Mise à jour des Prix", icon: Icons.LineChart },
  ]

  const fadeInUp = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 50 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.8 }
  }

  return (
    <>
      {/* Structured Data pour SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Pokéindex",
            "description": "Comparateur de prix pour le marché secondaire Pokémon. Comparez Cardmarket, eBay, LeBonCoin et Vinted en temps réel.",
            "url": "https://votre-domaine.com",
            "applicationCategory": "FinanceApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "EUR"
            }
          })
        }}
      />

      <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Hero Section */}
        <section 
          className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center overflow-hidden"
          aria-labelledby="hero-title"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" aria-hidden="true" />
          
          {!prefersReducedMotion && (
            <>
              <div className="absolute top-10 right-5 sm:top-20 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
              <div className="absolute bottom-10 left-5 sm:bottom-20 sm:left-20 w-40 h-40 sm:w-80 sm:h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} aria-hidden="true" />
            </>
          )}
          
          <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              
              <motion.div 
                className="space-y-6 sm:space-y-8 text-center lg:text-left"
                {...fadeInUp}
              >
                <motion.div
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full 
                    bg-primary/10 border border-primary/20 backdrop-blur-sm text-sm sm:text-base"
                  role="status"
                  aria-live="polite"
                >
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className={prefersReducedMotion ? "absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" : "animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"} />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-primary">
                    100% Gratuit · Marché Secondaire Pokémon
                  </span>
                </motion.div>

                <div className="space-y-5 sm:space-y-7">
                  <h1 
                    id="hero-title"
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight"
                  >
                    <span className="block">Maîtrisez le marché</span>
                    <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      secondaire Pokémon
                    </span>
                  </h1>
                  
                  <p className="text-base sm:text-lg lg:text-xl text-muted-foreground/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    <span className="font-semibold text-foreground">Trouvez les meilleures offres</span> en comparant{" "}
                    <span className="font-semibold text-[#0066CC]">Cardmarket</span>,{" "}
                    <span className="font-semibold text-[#EC5A13]">LeBonCoin</span>,{" "}
                    <span className="font-semibold text-[#92c821]">eBay</span> et{" "}
                    <span className="font-semibold text-[#09B1BA]">Vinted</span> en temps réel.{" "}
                    <span className="block mt-2 sm:mt-3">
                      Suivez l'évolution des prix depuis la sortie et explorez 100K+ cartes.
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start" role="list" aria-label="Plateformes supportées">
                  {platforms.map((platform, i) => (
                    <motion.div
                      key={platform.name}
                      role="listitem"
                      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: prefersReducedMotion ? 0 : 0.4 + i * 0.1 }}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl
                        bg-gradient-to-r ${platform.color} bg-opacity-10
                        border-white/10 backdrop-blur-sm
                        hover:scale-105 transition-transform duration-300
                      `}
                      aria-label={platform.ariaLabel}
                    >
                      <span className="text-lg" aria-hidden="true">{platform.icon}</span>
                      <span className="text-sm font-semibold text-foreground">{platform.name}</span>
                    </motion.div>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start pt-2">
                  <Button 
                    asChild
                    size="lg" 
                    className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-xl
                      shadow-lg hover:shadow-xl
                      bg-gradient-to-r from-primary to-primary/70
                      transition-all duration-300 hover:scale-105 w-full sm:w-auto group"
                    aria-label="Accéder à la recherche de produits"
                  >
                    <Link href="/recherche">
                      <span className="hidden sm:inline">Rechercher des Produits</span>
                      <span className="sm:hidden">Rechercher</span>
                      <Icons.search className="ml-2 h-4 sm:h-5 w-4 sm:w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button 
                    asChild
                    variant="outline" 
                    size="lg" 
                    className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-xl
                      border-border/50 hover:bg-muted/50 hover:border-primary/30
                      transition-all duration-300 hover:scale-105 w-full sm:w-auto group"
                    aria-label="Explorer la base de cartes TCGdex"
                  >
                    <Link href="/tcgdex">
                      <span className="hidden sm:inline">Explorer les Cartes</span>
                      <span className="sm:hidden">Explorer</span>
                      <Icons.zap className="ml-2 h-4 sm:h-5 w-4 sm:w-5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-4 sm:pt-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <Icons.zap className="h-3 w-3 text-green-600 dark:text-green-400" aria-hidden="true" />
                    <span className="text-xs font-semibold text-green-700 dark:text-green-300">API TCGdex Officielle</span>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-semibold">Données en continu</p>
                    <p className="text-xs text-muted-foreground">Mise à jour quotidienne</p>
                  </div>
                </div>
              </motion.div>

              {mounted && (
                <motion.div 
                  className="relative hidden lg:block"
                  initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.2 }}
                  aria-hidden="true"
                >
                  <div className="relative w-full h-[500px] xl:h-[600px]">
                    <motion.div
                      className="absolute inset-0 rounded-2xl xl:rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10 
                        backdrop-blur-xl border border-border/50 shadow-2xl p-6 xl:p-8"
                      animate={prefersReducedMotion ? {} : { y: [0, -20, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="w-full h-full rounded-xl xl:rounded-2xl bg-background/50 backdrop-blur-sm border border-border/30 
                        flex flex-col items-center justify-center p-6 space-y-6">
                        
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Icons.search className="h-10 w-10 text-primary" strokeWidth={2} />
                        </div>

                        <div className="flex gap-4">
                          {platforms.map((platform, i) => (
                            <motion.div
                              key={platform.name}
                              className={`
                                w-16 h-20 rounded-lg bg-gradient-to-br ${platform.color}
                                shadow-lg border dark:border-white/50 border-black/10 flex items-center justify-center text-2xl
                              `}
                              animate={prefersReducedMotion ? {} : { 
                                y: [0, -10, 0],
                                rotate: [0, 5 - i * 5, 0]
                              }}
                              transition={{ 
                                duration: 2 + i * 0.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.3
                              }}
                            >
                              {platform.icon}
                            </motion.div>
                          ))}
                        </div>

                        <div className="w-full space-y-2">
                          {[60, 85, 45].map((width, i) => (
                            <motion.div
                              key={i}
                              className="h-2 rounded-full bg-gradient-to-r from-primary/30 to-purple-500/30"
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={prefersReducedMotion ? { duration: 0 } : { 
                                duration: 1.5,
                                delay: 1 + i * 0.2,
                                repeat: Infinity,
                                repeatDelay: 2
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="absolute -left-4 xl:-left-8 top-1/4 px-4 xl:px-6 py-3 xl:py-4 rounded-xl xl:rounded-2xl 
                        bg-background/90 backdrop-blur-xl border border-border/50 shadow-xl"
                      animate={prefersReducedMotion ? {} : { x: [0, 10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div className="flex items-center gap-2 xl:gap-3">
                        <span className="text-2xl" aria-hidden="true">🏪</span>
                        <div>
                          <p className="text-xl xl:text-2xl font-bold">€24.99</p>
                          <p className="text-[10px] xl:text-xs text-muted-foreground">Cardmarket</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="absolute -right-4 xl:-right-8 bottom-1/4 px-4 xl:px-6 py-3 xl:py-4 rounded-xl xl:rounded-2xl 
                        bg-background/90 backdrop-blur-xl border border-border/50 shadow-xl"
                      animate={prefersReducedMotion ? {} : { x: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    >
                      <div className="flex items-center gap-2 xl:gap-3">
                        <Icons.LineChart className="h-5 xl:h-6 w-5 xl:w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                        <div>
                          <p className="text-xl xl:text-2xl font-bold text-green-600 dark:text-green-400">+18%</p>
                          <p className="text-[10px] xl:text-xs text-muted-foreground">30 jours</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-center mt-8 lg:hidden" aria-hidden="true">
                <div className="relative w-48 h-60 rounded-xl bg-background shadow-lg p-4 border border-border/50">
                  <div className="w-full h-full rounded-lg bg-background flex flex-col items-center justify-center p-4 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Icons.search className="h-5 w-5 text-primary" strokeWidth={2} />
                    </div>
                    <div className="flex gap-2">
                      {platforms.map((platform) => (
                        <div key={platform.name} className={`w-8 h-8 rounded-full flex items-center justify-center ${platform.mobileColor}`}>
                          <span className="text-base">{platform.icon}</span>
                        </div>
                      ))}
                    </div>
                    <div className="w-full space-y-1 mt-2">
                      <div className="h-1.5 w-[60%] rounded-full bg-blue-500" />
                      <div className="h-1.5 w-[85%] rounded-full bg-yellow-500" />
                      <div className="h-1.5 w-[45%] rounded-full bg-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section 
          className="py-12 sm:py-16 lg:py-20 border-y border-border/40 bg-muted/20"
          aria-labelledby="stats-title"
        >
          <h2 id="stats-title" className="sr-only">Statistiques de la plateforme</h2>
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: prefersReducedMotion ? 0 : index * 0.1 }}
                    className="flex flex-col items-center text-center p-6 sm:p-8 rounded-xl sm:rounded-2xl 
                      bg-background/50 backdrop-blur-sm border border-border/50
                      hover:bg-background/80 transition-all duration-300 hover:scale-105"
                  >
                    <div className="w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4" aria-hidden="true">
                      <IconComponent className="h-6 sm:h-7 lg:h-8 w-6 sm:w-7 lg:w-8 text-primary" strokeWidth={2} />
                    </div>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">{stat.value}</p>
                    <p className="text-sm sm:text-base text-muted-foreground">{stat.label}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section 
          className="py-16 sm:py-20 lg:py-24"
          aria-labelledby="features-title"
        >
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <motion.div 
              className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 id="features-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold px-4">
                Trois outils{" "}
                <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  puissants
                </span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                Tout ce dont vous avez besoin pour naviguer sur le marché secondaire Pokémon
              </p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon
                const isHovered = hoveredFeature === index

                return (
                  <motion.article
                    key={index}
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: prefersReducedMotion ? 0 : index * 0.15 }}
                    className="group relative"
                  >
                    <Link 
                      href={feature.href}
                      onMouseEnter={() => setHoveredFeature(index)}
                      onMouseLeave={() => setHoveredFeature(null)}
                      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
                      aria-label={feature.ariaLabel}
                    >
                      <div className={`
                        relative p-6 sm:p-8 rounded-xl sm:rounded-2xl border transition-all duration-500
                        ${isHovered 
                          ? `${feature.borderColor} bg-gradient-to-br ${feature.gradient} shadow-xl md:scale-105` 
                          : 'border-border/50 bg-background/50 shadow-sm hover:shadow-md'
                        }
                        md:hover:scale-105
                      `}>
                        <div className="absolute top-4 right-4">
                          <span className={`
                            text-[10px] font-bold px-2 py-1 rounded-full
                            ${isHovered ? 'bg-background/80' : 'bg-muted/80'}
                            transition-colors duration-300
                          `}>
                            {feature.badge}
                          </span>
                        </div>

                        <div className={`
                          w-12 sm:w-14 h-12 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center mb-4 sm:mb-6
                          bg-gradient-to-br ${feature.gradient} border ${feature.borderColor}
                          transition-all duration-500
                          ${isHovered ? 'md:scale-110 md:rotate-3' : ''}
                        `} aria-hidden="true">
                          <IconComponent 
                            className={`h-6 sm:h-7 w-6 sm:w-7 ${feature.iconColor} transition-transform duration-500 ${isHovered ? 'md:scale-110' : ''}`}
                            strokeWidth={2}
                          />
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                          {feature.description}
                        </p>

                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                          <span>Découvrir</span>
                          <Icons.zap className={`h-4 w-4 transition-transform duration-300 ${isHovered ? 'md:translate-x-1' : ''}`} aria-hidden="true" />
                        </div>

                        {!prefersReducedMotion && (
                          <div className={`
                            absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient}
                            opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10
                            blur-xl
                          `} aria-hidden="true" />
                        )}
                      </div>
                    </Link>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="relative py-20 sm:py-28 lg:py-32 overflow-hidden"
          aria-labelledby="cta-title"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" aria-hidden="true" />
          
          <motion.div 
            className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full 
                bg-primary/10 border border-primary/20 backdrop-blur-sm"
                role="status"
                aria-live="polite"
              >
                <Icons.zap className="h-3 sm:h-4 w-3 sm:w-4 text-primary" aria-hidden="true" />
                <span className="text-xs sm:text-sm font-semibold text-primary">
                  100% Gratuit · Sans Inscription
                </span>
              </div>

              <h2 id="cta-title" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight px-4">
                Prêt à trouver les
                <span className="block mt-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  meilleures offres ?
                </span>
              </h2>
              
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                Comparez les prix sur Cardmarket, eBay et Vinted dès maintenant. 
                Aucune inscription requise.
              </p>

              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center pt-2 sm:pt-4 px-4">
                <Button 
                  asChild
                  size="lg" 
                  className="h-14 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-semibold rounded-xl
                    shadow-lg hover:shadow-xl
                    bg-gradient-to-r from-primary to-primary/90
                    transition-all duration-300 hover:scale-105 group w-full sm:w-auto"
                  aria-label="Commencer la recherche de produits"
                >
                  <Link href="/recherche">
                    <span className="hidden sm:inline">Commencer la Recherche</span>
                    <span className="sm:hidden">Commencer</span>
                    <Icons.search className="ml-2 h-5 sm:h-6 w-5 sm:w-6 transition-transform group-hover:scale-110" aria-hidden="true" />
                  </Link>
                </Button>
              </div>

              <ul className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center pt-6 sm:pt-8 text-xs sm:text-sm text-muted-foreground px-4 list-none">
                <li className="flex items-center justify-center gap-2">
                  <Icons.zap className="h-3 sm:h-4 w-3 sm:w-4 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                  <span>Gratuit à vie</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <Icons.zap className="h-3 sm:h-4 w-3 sm:w-4 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                  <span>Sans inscription</span>
                </li>
                <li className="flex items-center justify-center gap-2">
                  <Icons.zap className="h-3 sm:h-4 w-3 sm:w-4 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                  <span>Données en temps réel</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer 
          className="border-t border-border/40 bg-muted/20 backdrop-blur-sm"
          role="contentinfo"
          aria-label="Informations du site"
        >
          <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-primary/20" aria-hidden="true">
                  <Icons.LineChart className="h-4 sm:h-5 w-4 sm:w-5 text-primary" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-base sm:text-lg">
                  Poké<span className="text-primary">index</span>
                </span>
              </div>

              <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm" aria-label="Navigation du pied de page">
                <Link href="/a-propos" className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded">
                  À propos
                </Link>
                <a 
                  href="https://www.tcgdex.net" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
                >
                  API TCGdex
                  <span className="sr-only">(ouvre dans un nouvel onglet)</span>
                </a>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded">
                  Contact
                </Link>
                <Link href="/mentions-legales" className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded">
                  Mentions légales
                </Link>
              </nav>

              <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
                © {new Date().getFullYear()} Pokéindex · Propulsé par Bubo
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}