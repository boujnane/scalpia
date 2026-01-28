'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"
import { useTokens } from "@/context/TokenContext"
import { getUserProfile, UserProfile } from "@/lib/user-profile"
import { Icons } from "@/components/icons"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu() {
  const router = useRouter()
  const { user, loading, isAdmin, isPro } = useAuth()
  const { tokens, maxTokens, percentage, isUnlimited, isExhausted } = useTokens()
  const [portalLoading, setPortalLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  // Charger le profil utilisateur
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    getUserProfile(user.uid).then(setProfile)
  }, [user])

  const handlePortal = async () => {
    if (!user) return
    setPortalLoading(true)
    try {
      const token = await user.getIdToken()
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || `API error ${response.status}`)
      if (!data?.url) throw new Error("No portal URL returned")
      window.location.assign(data.url)
    } catch (error) {
      console.error("Portal error:", error)
    } finally {
      setPortalLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    router.push("/")
  }

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        Connexion
      </button>
    )
  }

  // Couleur du ring selon les tokens
  const getTokenColor = () => {
    if (isUnlimited) return "ring-purple-500"
    if (isExhausted) return "ring-red-500"
    if (percentage <= 20) return "ring-orange-500"
    if (percentage <= 50) return "ring-yellow-500"
    return "ring-emerald-500"
  }

  // Initiales (prenom/nom ou email)
  const getInitials = () => {
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : "U"
  }

  // Nom affiche
  const displayName = profile?.firstName
    ? `${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ""}`
    : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`
          relative flex items-center justify-center h-9 w-9 rounded-full
          ring-2 ring-offset-2 ring-offset-background
          ${getTokenColor()}
          hover:scale-105 transition-all duration-200
          focus:outline-none focus-visible:ring-primary
          overflow-hidden
        `}>
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt="Avatar"
              className="h-full w-full object-cover"
              onError={(e) => {
                // Fallback si l'image ne charge pas
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <span className="flex items-center justify-center h-full w-full bg-gradient-to-br from-primary/20 to-purple-500/20 text-xs font-bold text-foreground">
              {getInitials()}
            </span>
          )}

          {/* Badge Pro/Admin */}
          {(isPro || isAdmin) && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-primary">
              {isAdmin ? (
                <Icons.shield className="h-2 w-2 text-primary-foreground" />
              ) : (
                <Icons.sparkles className="h-2 w-2 text-primary-foreground" />
              )}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-0 overflow-hidden">
        {/* Header avec infos utilisateur */}
        <div className="px-4 py-3 bg-muted/30">
          {displayName && (
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
          )}
          <p className={`text-sm text-foreground truncate ${displayName ? "text-muted-foreground text-xs" : "font-medium"}`}>
            {user.email}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {isAdmin ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-500">
                <Icons.shield className="h-2.5 w-2.5" />
                Admin
              </span>
            ) : isPro ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary">
                <Icons.sparkles className="h-2.5 w-2.5" />
                Pro
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                Free
              </span>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="m-0" />

        {/* Tokens section */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Jetons aujourd'hui
            </span>
            <span className="text-sm font-bold tabular-nums">
              {isUnlimited ? (
                <span className="text-purple-500">Illimite</span>
              ) : (
                <span className={isExhausted ? "text-red-500" : "text-foreground"}>
                  {tokens}/{maxTokens}
                </span>
              )}
            </span>
          </div>
          {!isUnlimited && (
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isExhausted
                    ? "bg-red-500"
                    : percentage <= 20
                    ? "bg-orange-500"
                    : percentage <= 50
                    ? "bg-yellow-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />

        <DropdownMenuGroup className="p-1">
          {isAdmin && (
            <DropdownMenuItem
              onClick={() => router.push("/admin")}
              className="gap-3 px-3 py-2.5 cursor-pointer rounded-lg"
            >
              <Icons.shield className="h-4 w-4 text-purple-500" />
              <span>Administration</span>
            </DropdownMenuItem>
          )}

          {isPro && !isAdmin && (
            <DropdownMenuItem
              onClick={handlePortal}
              disabled={portalLoading}
              className="gap-3 px-3 py-2.5 cursor-pointer rounded-lg"
            >
              {portalLoading ? (
                <Icons.loader className="h-4 w-4 animate-spin" />
              ) : (
                <Icons.creditCard className="h-4 w-4" />
              )}
              <span>Gerer l'abonnement</span>
            </DropdownMenuItem>
          )}

          {!isPro && !isAdmin && (
            <DropdownMenuItem
              onClick={() => router.push("/pricing")}
              className="gap-3 px-3 py-2.5 cursor-pointer rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 hover:from-primary/20 hover:to-purple-500/20"
            >
              <Icons.zap className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Passer Pro</span>
              <span className="ml-auto text-xs text-muted-foreground">9€/mois</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="m-0" />

        <div className="p-1">
          <DropdownMenuItem
            onClick={() => router.push("/settings")}
            className="gap-3 px-3 py-2.5 cursor-pointer rounded-lg"
          >
            <Icons.settings className="h-4 w-4" />
            <span>Parametres</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleLogout}
            variant="destructive"
            className="gap-3 px-3 py-2.5 cursor-pointer rounded-lg"
          >
            <Icons.close className="h-4 w-4" />
            <span>Deconnexion</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
