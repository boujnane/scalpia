'use client'

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { ThemeToggle } from "../theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { UserMenu } from "./UserMenu"
import ItemSearchDialog from "@/components/ItemSearchDialog"
import { TokenBadge } from "@/components/ui/TokenBadge"
import { getUserProfile, UserProfile } from "@/lib/user-profile"

type IndexStatus = "UP_TO_DATE" | "IN_PROGRESS" | "OUTDATED"

const navLinks = [
  {
    name: "Rechercher",
    href: "/rechercher",
    icon: Icons.scanSearch,
  },
  {
    name: "Analyser",
    href: "/analyse",
    icon: Icons.linechart,
  },
  {
    name: "Cartes",
    href: "/cartes",
    icon: Icons.walletCards,
  },
  {
    name: "Collection",
    href: "/ma-collection",
    icon: Icons.collection,
  },
  {
    name: "Tarifs",
    href: "/pricing",
    icon: Icons.badgeDollarSign,
  },
  {
    name: "Méthodologie",
    href: "/methodologie",
    icon: Icons.badgeQuestionMark,
  },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const { user, loading, isAdmin, isPro } = useAuth()

  // Charger le profil utilisateur
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    getUserProfile(user.uid).then(setProfile)
  }, [user])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    fetch("/api/index-status")
      .then((res) => res.json())
      .then((data) => setIndexStatus(data.status))
      .catch(() => setIndexStatus("OUTDATED"))
  }, [])

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  // Index Status Dot - Discret avec tooltip
  const IndexDot = () => {
    if (!indexStatus) return null

    const config = {
      UP_TO_DATE: {
        label: "Index a jour",
        color: "bg-emerald-500",
        pulse: false,
      },
      IN_PROGRESS: {
        label: "Mise a jour en cours",
        color: "bg-amber-500",
        pulse: true,
      },
      OUTDATED: {
        label: "Index en retard",
        color: "bg-red-500",
        pulse: true,
      },
    }[indexStatus]

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="relative flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted/50 transition-colors">
            <span className="relative flex h-2 w-2">
              {config.pulse && (
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.color}`} />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${config.color}`} />
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  // Desktop Navigation - Style Vercel/Stripe
  const DesktopNavigation = () => (
    <nav className="hidden lg:flex items-center">
      {navLinks.map((link) => {
        const active = isLinkActive(link.href)

        return (
          <Link
            key={link.href}
            href={link.href}
            className="relative group"
          >
            <div className={`
              relative px-4 py-2 text-sm font-medium transition-colors duration-200
              ${active
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
              }
            `}>
              {link.name}

              {/* Underline indicator */}
              {active && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-foreground rounded-full"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}
            </div>
          </Link>
        )
      })}
    </nav>
  )

  const mobileQuickLinks = [
    { name: "Cartes", href: "/cartes", icon: Icons.walletCards },
    { name: "Analyse", href: "/analyse", icon: Icons.linechart },
    { name: "Collection", href: "/ma-collection", icon: Icons.collection },
  ]

  // Mobile Navigation
  const MobileNavigation = () => (
    <nav className="flex flex-col gap-1 p-2">
      {navLinks.map((link, index) => {
        const active = isLinkActive(link.href)
        const IconComponent = link.icon

        return (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              href={link.href}
              onClick={() => setSheetOpen(false)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${active
                  ? "bg-primary/10 text-foreground font-medium ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }
              `}
            >
              <IconComponent className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{link.name}</span>
              {active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-foreground" />
              )}
            </Link>
          </motion.div>
        )
      })}
    </nav>
  )

  return (
    <header className={`
      sticky top-0 z-50 w-full transition-all duration-300
      ${isScrolled
        ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
        : "bg-background/50 backdrop-blur-md border-b border-transparent"
      }
    `}>
      <div className="flex h-16 items-center justify-between px-4 md:px-6 lg:px-8 max-w-screen-2xl mx-auto">

        {/* Logo */}
        <Link
          href="/"
          data-tutorial="nav-logo"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
        <div className="relative h-24 w-24">
          <Image
            src="/logo/logo_pki.png"
            alt="Pokeindex"
            fill
            className="object-contain"
            priority
          />
        </div>
        <span className="font-bold text-lg tracking-tight hidden sm:block -ml-4">
          Poké<span className="text-primary">index</span>
        </span>
        </Link>

        {/* Desktop Nav */}
        <div data-tutorial="nav-links">
          <DesktopNavigation />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {/* Index Status Dot */}
          <div className="hidden md:flex">
            <IndexDot />
          </div>

          {/* Separator */}
          <div className="hidden md:block h-5 w-px bg-border mx-2" />

          {/* Search */}
          <div data-tutorial="nav-search">
            <ItemSearchDialog
              buttonClassName="h-8 w-8 rounded-lg hover:bg-muted/50"
            />
          </div>

          {/* Theme Toggle */}
          <div className="hidden sm:flex" data-tutorial="nav-theme">
            <ThemeToggle />
          </div>

          {/* Separator */}
          <div className="hidden lg:block h-5 w-px bg-border mx-2" />

          {/* Token Badge - Visible */}
          <div className="hidden md:flex" data-tutorial="nav-tokens">
            <TokenBadge compact />
          </div>
          <div className="flex md:hidden" data-tutorial="nav-tokens">
            <TokenBadge compact />
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden lg:flex items-center ml-2" data-tutorial="nav-user">
            <UserMenu />
          </div>

          {/* Mobile Menu */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8 rounded-lg"
                data-tutorial="nav-menu"
              >
                <Icons.menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] max-w-[360px] p-0 overflow-hidden">
              {/* Header */}
              <div className="relative border-b border-border">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
                <div className="relative p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-24 w-24">
                      <Image
                        src="/logo/logo_pki.png"
                        alt="Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <SheetTitle className="text-lg font-bold -ml-5">
                        Pokeindex
                      </SheetTitle>
                      <p className="text-xs text-muted-foreground -ml-5">
                        Suivi & collection Pokemon
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {mobileQuickLinks.map((link) => {
                      const IconComponent = link.icon
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setSheetOpen(false)}
                          className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-background/70 px-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                        >
                          <IconComponent className="h-4 w-4" />
                          <span className="truncate">{link.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-3 pt-4">
                  <p className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                    Navigation
                  </p>
                </div>
                <MobileNavigation />
              </div>

              {/* User Section */}
              <div className="mt-auto p-4 border-t border-border bg-muted/20">
                {!loading && !user ? (
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSheetOpen(false)
                      router.push("/login")
                    }}
                  >
                    Connexion
                  </Button>
                ) : (
                  <div className="space-y-3">
                    {/* User info avec avatar cliquable */}
                    <button
                      onClick={() => {
                        setSheetOpen(false)
                        router.push("/settings")
                      }}
                      className="flex items-center gap-3 w-full rounded-xl border border-border/60 bg-background/80 px-3 py-3 hover:border-primary/30 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-offset-2 ring-offset-background ring-primary/30">
                        {profile?.photoURL ? (
                          <img
                            src={profile.photoURL}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-primary/20 to-purple-500/20 text-foreground font-bold">
                            {profile?.firstName && profile?.lastName
                              ? `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase()
                              : user?.email?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            {profile?.firstName && (
                              <p className="text-sm font-semibold truncate">
                                {profile.firstName} {profile.lastName}
                              </p>
                            )}
                            <p className={`text-sm truncate ${profile?.firstName ? "text-xs text-muted-foreground" : "font-medium"}`}>
                              {user?.email}
                            </p>
                          </div>
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-500 border border-purple-500/30">
                              <Icons.shield className="h-2.5 w-2.5" />
                              Admin
                            </span>
                          ) : isPro ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                              <Icons.sparkles className="h-2.5 w-2.5" />
                              Pro
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border/60">
                              Free
                            </span>
                          )}
                        </div>
                      </div>

                      <Icons.settings className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      {!isPro && !isAdmin && (
                        <Button
                          size="sm"
                          className="col-span-2 bg-gradient-to-r from-primary to-purple-600"
                          onClick={() => {
                            setSheetOpen(false)
                            router.push("/pricing")
                          }}
                        >
                          <Icons.zap className="h-4 w-4 mr-2" />
                          Passer Pro
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSheetOpen(false)
                            router.push("/admin")
                          }}
                        >
                          <Icons.shield className="h-4 w-4 mr-2" />
                          Admin
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className={isAdmin || (!isPro && !isAdmin) ? "" : "col-span-2"}
                        onClick={async () => {
                          await signOut(auth)
                          setSheetOpen(false)
                          router.push("/")
                        }}
                      >
                        Deconnexion
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
