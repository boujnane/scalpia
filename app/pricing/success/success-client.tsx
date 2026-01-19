"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useAuth } from "@/context/AuthContext"
import { captureEvent } from "@/lib/posthog"
import posthog from "posthog-js"

export default function SuccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  const { isPro } = useAuth()
  const [countdown, setCountdown] = useState(8)
  const tracked = useRef(false)
  const [interval, setInterval] = useState<string | null>(null)

  // 1) Countdown timer
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  // 2) Redirect when countdown hits 0
  useEffect(() => {
    if (countdown !== 0) return
    router.replace("/analyse")
  }, [countdown, router])

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    const storedInterval = typeof window !== "undefined"
      ? window.localStorage.getItem("ph_checkout_interval")
      : null
    setInterval(storedInterval)

    const payload = {
      plan: "pro",
      interval: storedInterval ?? undefined,
      sessionId: sessionId ?? undefined,
    }

    const tryCapture = (attemptsLeft: number) => {
      const loaded = (posthog as unknown as { __loaded?: boolean }).__loaded
      if (loaded && typeof posthog.capture === "function") {
        posthog.capture("checkout_success", payload)
        return
      }
      if (attemptsLeft <= 0) {
        captureEvent("checkout_success", payload)
        return
      }
      window.setTimeout(() => tryCapture(attemptsLeft - 1), 300)
    }

    if (typeof window !== "undefined") {
      tryCapture(5)
    } else {
      captureEvent("checkout_success", payload)
    }
  }, [sessionId])

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border border-border/50 bg-background/70 backdrop-blur p-6 sm:p-8 text-center shadow-sm"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 border border-green-500/20">
          <Icons.check className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight">Paiement réussi 🎉</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          {isPro
            ? "Ton compte Pro est actif. Tu peux retourner à l’index."
            : "On active ton compte Pro… (ça peut prendre quelques secondes)."}
        </p>

        {sessionId && (
          <p className="mt-3 text-[11px] text-muted-foreground/70">
            Session : <span className="font-mono">{sessionId}</span>
          </p>
        )}

        <div className="mt-6 grid gap-3">
          <Button className="h-11 rounded-xl font-semibold" onClick={() => router.replace("/analyse")}>
            Continuer vers l’index
            <Icons.arrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Button asChild variant="outline" className="h-11 rounded-xl font-semibold">
            <Link href="/pricing">Retour aux tarifs</Link>
          </Button>
        </div>

        <p className="mt-5 text-xs text-muted-foreground/70">
          Redirection automatique dans <span className="font-semibold">{countdown}</span>s…
        </p>
      </motion.div>
    </div>
  )
}
