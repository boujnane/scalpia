// app/a-propos/page.tsx
"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"

export default function AProposPage() {
  const prefersReducedMotion = useReducedMotion()

  const fadeUp = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.7 },
  }

  const highlights = [
    {
      label: "Histoire",
      title: "Une passion née dans la cour de récréation",
      body:
        "Ma première rencontre avec les cartes Pokémon remonte bien avant Pokéindex, à une époque où la cour de récréation faisait office de terrain d’aventure. À la fin des années 90, début des années 2000, on lançait nos cartes contre un mur, le souffle suspendu : celle qui s’en approchait le plus gagnait, et avec elle, la carte de son adversaire. J’en ai gardé quelques dizaines aujourd’hui, témoins silencieux de ces duels improvisés. À l’époque, mon père refusait de m’en acheter — « c’est trop cher », disait-il, sans imaginer la valeur qu’aurait aujourd’hui un simple booster Neo. Peut-être que tout a commencé là : dans ce mélange de désir, de frustration et de fascination, qui transforme un jeu d’enfant en passion durable."
    },
    {
      label: "Parcours",
      title: "Créer, échouer, recommencer",
      body:
      "Je m’appelle Ady Boujnane. J’ai fondé Bubo en 2017 avec deux amis, alors que nous étions encore étudiants. Très tôt, j’ai compris que mon parcours ne suivrait pas les lignes attendues. Dans un système académique valorisant la conformité plus que l’invention, l’originalité devient un risque. Cette inadéquation m’a coûté du temps, de la stabilité, et des opportunités, mais elle m’a aussi forcé à apprendre en dehors du cadre. Depuis près de dix ans, j’ai enchaîné les projets : de Kumbu à Fibrus, en passant par Bubo-Tennis. J’en ai oublié le nombre, jamais l’exigence. Pour moi, un projet n’est pas un test : c’est un engagement."
    },
    {
      label: "Vision",
      title: "Pokéindex, un choix de vie",
      body:
      "Pokéindex n’est pas un passe-temps. C’est une position. Je n’ai pas choisi la facilité, ni l’attente. Le projet ne me fait pas vivre, tout comme aucun de mes projets jusqu'ici, mais je continue d'avancer, chaque jour, porté par une vision claire. Je continue parce que je sais où je vais : rendre le marché Pokémon compréhensible et structuré. Et si ce projet devait s’éteindre, il en naîtrait un autre. Puis un autre encore. Car ce qui compte n’est pas la forme que prend l’élan, mais l’élan lui-même — cette persévérance qui traverse les projets, les dépasse, finit toujours par ouvrir un chemin.",

    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <section className="relative overflow-hidden border-b border-border/50">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5"
          aria-hidden="true"
        />

        {!prefersReducedMotion && (
          <>
            <div
              className="absolute top-10 right-6 sm:top-16 sm:right-16 w-56 h-56 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"
              aria-hidden="true"
            />
            <div
              className="absolute bottom-10 left-6 sm:bottom-16 sm:left-16 w-44 h-44 sm:w-80 sm:h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
              aria-hidden="true"
            />
          </>
        )}

        <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              {...fadeUp}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
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
                À propos
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.7,
                delay: prefersReducedMotion ? 0 : 0.06,
              }}
              className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08]"
            >
              Ady et Bubo,{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                la même obstination
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.7,
                delay: prefersReducedMotion ? 0 : 0.12,
              }}
              className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed text-justify"
            >
              Bubo est né à trois, puis s’est élargi à quatre, comme beaucoup de projets qui évoluent avec le temps. Les idées se partagent, les intentions aussi. L’engagement, lui, finit toujours par se distinguer. Pokéindex est né de cette constance : une passion d’enfance transformée en projet, avec une ambition simple, rendre le marché Pokémon lisible et compréhensible.
            </motion.p>


            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.6,
                delay: prefersReducedMotion ? 0 : 0.24,
              }}
              className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
            >
            <Badge variant="outline" className="text-xs sm:text-sm">
              Passion & collection
            </Badge>
            <Badge variant="outline" className="text-xs sm:text-sm">
              Structure & lisibilité
            </Badge>
            <Badge variant="outline" className="text-xs sm:text-sm">
              Engagement dans le temps
            </Badge>
            </motion.div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-14 space-y-12 sm:space-y-16">
        <section className="grid gap-6 lg:grid-cols-3">
          {highlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.6,
                delay: prefersReducedMotion ? 0 : index * 0.1,
              }}
              className="rounded-2xl border border-border/50 bg-muted/10 p-6"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item.label}
              </div>
              <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed text-justify">
                {item.body}
              </p>
            </motion.div>
          ))}
        </section>

        <section className="rounded-3xl border border-border/50 bg-gradient-to-br from-background via-muted/30 to-background p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] items-center">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">
                Un projet personnel, guidé par un hibou
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-justify">
                Pokéindex n’est pas né d’une bonne idée, mais d’une obsession. Celle de
                construire quelque chose qui me ressemble, même quand c’est long, même
                quand c’est difficile. Ce projet concentre mes essais, mes erreurs, mes
                remises en question et surtout cette envie tenace d’aller au bout.
                Tant que le hibou n’aura pas trouvé sa place, moi non plus.
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/70 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icons.sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Ce qui me guide</p>
                  <p className="text-xs text-muted-foreground">
                    Persévérance, honnêteté, passion
                  </p>
                </div>
              </div>

              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Icons.check className="h-4 w-4 text-primary" />
                  <span>Un regard sincère sur le marché</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icons.check className="h-4 w-4 text-primary" />
                  <span>Une analyse pensée pour les collectionneurs et les investisseurs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icons.check className="h-4 w-4 text-primary" />
                  <span>Un projet construit pour durer</span>
                </div>
              </div>

              

              <Button asChild size="lg" className="w-full rounded-xl">
                <Link href="/cartes">
                  Explorer les cartes
                  <Icons.arrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              
            </div>
          </div>
        </section>
        <section className="rounded-3xl border border-border/50 bg-gradient-to-br from-background via-muted/30 to-background p-8 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] items-start">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                Remerciements
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold leading-tight">
                Des mains fiables quand il fallait tenir le cap
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-justify">
                Ce projet ne s’est pas construit seul. Je tiens à remercier sincèrement Sofiane Jouahri,
                qui m’a plus qu’épaulé jusqu’ici. Lorsqu’il m’était impossible d’être partout à la fois,
                il a su prendre le relais avec rigueur, en assurant la veille des prix et en maintenant
                une continuité essentielle au projet.
              </p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/70 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icons.badgeDollarSign className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Soutenez-nous</p>
                  <p className="text-xs text-muted-foreground">
                    Si notre projet vous a touché et que vous voulez faire un don, c est par ici.
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed text-justify">
                Son soutien n’a jamais été ponctuel : il a été constant et profondément structurant,
                ce qui a permis à Pokéindex d’avancer avec stabilité.
              </p>
              <Button asChild className="w-full rounded-xl">
                <Link href="https://paypal.me/adyboujnane" target="_blank" rel="noreferrer">
                  Faire un don via PayPal
                  <Icons.external className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
