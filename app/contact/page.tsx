// app/contact/page.tsx
"use client"

import { useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { useAuth } from "@/context/AuthContext"

type FormState = "idle" | "loading" | "success" | "error"

export default function ContactPage() {
  const prefersReducedMotion = useReducedMotion()
  const { user } = useAuth()

  const [state, setState] = useState<FormState>("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    // honeypot anti-bot: doit rester vide
    company: "",
  })

  const meta = useMemo(
    () => ({
      title: "Contact — Pokéindex",
      subtitle:
        "Une question sur l’index, une suggestion, ou une demande pro ? Écris-nous, on répond vite, promis !",
      hints: [
        { label: "Support", value: "Sous 48h ouvrées", icon: "lifeBuoy" as const },
        { label: "Données", value: "Sources publiques agrégées", icon: "database" as const },
        { label: "Sécurité", value: "Aucune donnée bancaire stockée", icon: "shield" as const },
      ],
    }),
    []
  )

  const fadeUp = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.65 },
  }

  const canSubmit =
    form.email.trim().length > 3 &&
    form.message.trim().length > 10 &&
    form.subject.trim().length > 2

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || state === "loading") return

    setState("loading")
    setErrorMsg(null)

    try {
      const token = user ? await user.getIdToken() : null

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          company: form.company, // honeypot
        }),
      })

      const data = await res.json().catch(() => ({} as any))

      if (!res.ok) {
        const msg =
          data?.error ||
          (res.status === 429
            ? "Trop de messages aujourd’hui. Réessaie plus tard."
            : "Une erreur est survenue. Réessaie.")
        throw new Error(msg)
      }

      setState("success")
      setForm({ name: "", email: "", subject: "", message: "", company: "" })
    } catch (err) {
      console.error(err)
      setErrorMsg(err instanceof Error ? err.message : "Une erreur est survenue.")
      setState("error")
    }
  }

  const Banner = () => (
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
        <div className="max-w-3xl mx-auto text-center">
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
            <span className="text-xs sm:text-sm font-semibold text-primary">Contact</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.7, delay: prefersReducedMotion ? 0 : 0.06 }}
            className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08]"
          >
            Dis-nous ce que tu veux{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              améliorer
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.7, delay: prefersReducedMotion ? 0 : 0.12 }}
            className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed"
          >
            {meta.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: prefersReducedMotion ? 0 : 0.24 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
          >
            {meta.hints.map((h) => {
              const I = Icons[h.icon]
              return (
                <span
                  key={h.label}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/40 text-xs text-muted-foreground"
                >
                  <I className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="font-semibold text-foreground/80">{h.label}</span>
                  <span className="text-muted-foreground/80">·</span>
                  <span>{h.value}</span>
                </span>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Banner />

      <main className="container mx-auto px-4 sm:px-6 md:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
            className="lg:col-span-7"
          >
            <Card className="bg-background/60 backdrop-blur-md border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl sm:text-2xl">Écrire un message</CardTitle>
                <CardDescription>
                  Donne un max de contexte (page concernée, lien, capture si besoin).
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  {/* honeypot anti-bot (invisible) */}
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.company}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                    className="hidden"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Nom</label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Ton nom (optionnel)"
                        className="h-11 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Email <span className="text-primary">*</span>
                      </label>
                      <Input
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        placeholder="ton@email.com"
                        type="email"
                        required
                        className="h-11 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Sujet <span className="text-primary">*</span>
                    </label>
                    <Input
                      value={form.subject}
                      onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                      placeholder="Ex: Bug sur la recherche / Demande pro / Suggestion"
                      required
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Message <span className="text-primary">*</span>
                    </label>
                    <Textarea
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Dis-nous ce qui se passe, ce que tu attends, et si possible les étapes pour reproduire."
                      required
                      className="min-h-[140px] rounded-xl"
                    />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground/80">
                      <span>Minimum conseillé : 10 caractères</span>
                      <span>{form.message.length} chars</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={!canSubmit || state === "loading"}
                      className="h-11 rounded-xl font-semibold bg-gradient-to-r from-primary to-purple-600 shadow-md hover:shadow-lg transition-all"
                    >
                      {state === "loading" ? (
                        <>
                          <Icons.loader className="mr-2 h-4 w-4 animate-spin" />
                          Envoi…
                        </>
                      ) : (
                        <>
                          <Icons.send className="mr-2 h-4 w-4" />
                          Envoyer
                        </>
                      )}
                    </Button>

                    {state === "success" && (
                      <div className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                        <Icons.check className="h-4 w-4" />
                        Message envoyé. Merci 🙌
                      </div>
                    )}

                    {state === "error" && (
                      <div className="inline-flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <Icons.alertTriangle className="h-4 w-4" />
                        {errorMsg || "Oups… réessaie ou contacte-nous autrement."}
                      </div>
                    )}
                  </div>

                  <p className="pt-4 text-[11px] text-muted-foreground/75 leading-relaxed">
                    En envoyant ce message, tu acceptes d’être contacté par email. Aucune donnée bancaire n’est
                    collectée ici. Pour la gestion d’abonnement :{" "}
                    <Link className="text-primary hover:underline" href="/pricing">
                      portail Stripe
                    </Link>
                    .
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Side panel */}
          <motion.aside
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: prefersReducedMotion ? 0 : 0.06 }}
            className="lg:col-span-5 space-y-6"
          >
            <Card className="bg-background/60 backdrop-blur-md border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Avant d’écrire</CardTitle>
                <CardDescription>On gagne du temps si tu ajoutes ça :</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
                    <Icons.link className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <p className="text-muted-foreground">
                    Le lien de la page concernée (ex: /analyse, /rechercher).
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
                    <Icons.bug className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <p className="text-muted-foreground">
                    Les étapes pour reproduire + navigateur (Chrome / Safari / mobile).
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
                    <Icons.image className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <p className="text-muted-foreground">
                    Une capture d’écran si c’est visuel (layout, bug UI, etc.).
                  </p>
                </div>

                <div className="pt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full">Bug</Badge>
                  <Badge variant="secondary" className="rounded-full">Suggestion</Badge>
                  <Badge variant="secondary" className="rounded-full">Partenariat</Badge>
                  <Badge variant="secondary" className="rounded-full">Presse</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-background/60 backdrop-blur-md border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Liens utiles</CardTitle>
                <CardDescription>Les pages où tu iras souvent 👇</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button asChild variant="outline" className="justify-start rounded-xl h-11">
                  <Link href="/pricing">
                    <Icons.creditCard className="mr-2 h-4 w-4" />
                    Tarifs & abonnement
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start rounded-xl h-11">
                  <Link href="/cgu">
                    <Icons.fileText className="mr-2 h-4 w-4" />
                    CGU
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-start rounded-xl h-11">
                  <Link href="/mentions-legales">
                    <Icons.scale className="mr-2 h-4 w-4" />
                    Mentions légales
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <div className="rounded-2xl border border-border/50 bg-muted/10 p-5 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <Icons.sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Astuce</p>
                  <p className="mt-1 leading-relaxed">
                    Si ton sujet concerne l’abonnement, précise si tu es en <strong>Free</strong> ou <strong>Pro</strong>,
                    et si tu viens de passer par Stripe.
                  </p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </main>
    </div>
  )
}
