"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

/**
 * Composant qui protege une page pour les utilisateurs connectes uniquement.
 * Redirige vers /login si non connecte.
 */
export default function AuthRequired({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=" + encodeURIComponent(window.location.pathname))
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
