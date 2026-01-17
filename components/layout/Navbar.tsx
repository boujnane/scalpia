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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

// --- TYPES & CONSTANTS ---
type IndexStatus = "UP_TO_DATE" | "IN_PROGRESS" | "OUTDATED"

const navLinks = [
  {
    name: "Rechercher",
    href: "/rechercher",
    icon: Icons.linechart,
    description: "Comparez sur le marché secondaire",
  },
  {
    name: "Analyser",
    href: "/analyse",
    icon: Icons.wallet,
    description: "Explorer les données de marché",
  },
  {
    name: "Cartes",
    href: "/cartes",
    icon: Icons.zap,
    description: "Parcourir les cartes",
  },
  {
    name: "Tarifs",
    href: "/pricing",
    icon: Icons.sparkles,
    description: "Offres Free et Premium",
  },
]

export function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const { user, loading, isAdmin, isPro } = useAuth();
  const [portalLoading, setPortalLoading] = useState(false);

  const handlePortal = async () => {
  if (!user) return;

  setPortalLoading(true);
  try {
    const token = await user.getIdToken();

    const response = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}), // inutile d'envoyer userId
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Portal API error:", response.status, data);
      throw new Error(data?.error || `API error ${response.status}`);
    }

    if (!data?.url) {
      throw new Error("No portal URL returned");
    }

    window.location.assign(data.url);
  } catch (error) {
    console.error("Portal error:", error);
    alert(`Une erreur est survenue : ${(error as Error).message}`);
  } finally {
    setPortalLoading(false);
  }
};

  const router = useRouter();
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)

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

  const IndexBadge = () => {
    if (!indexStatus) return null

    const config = {
      UP_TO_DATE: {
        label: "Index à jour",
        bg: "bg-emerald-100/50 border-emerald-200 text-foreground",
        dot: "bg-emerald-500",
      },
      IN_PROGRESS: {
        label: "Index en cours",
        bg: "bg-amber-100/50 border-amber-200 text-foreground",
        dot: "bg-amber-500",
      },
      OUTDATED: {
        label: "Index pas à jour",
        bg: "bg-red-100/50 border-red-200 text-foreground",
        dot: "bg-red-500",
      },
    }[indexStatus]

    return (
      <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm transition-all duration-300 hover:scale-105 ${config.bg}`}>
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {config.label}
        </span>
      </div>
    )
  }

  const DesktopNavigation = () => (
    <nav className="hidden lg:flex items-center gap-1">
      {navLinks.map((link) => {
        const active = isLinkActive(link.href)
        const IconComponent = link.icon
        const isHovered = hoveredLink === link.href

        return (
          <Link
            key={link.href}
            href={link.href}
            onMouseEnter={() => setHoveredLink(link.href)}
            onMouseLeave={() => setHoveredLink(null)}
            className="relative group"
          >
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ease-out ${active ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'}`}>
              <IconComponent className={`h-4 w-4 transition-all duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={active ? 2.5 : 2} />
              <span className="text-sm font-medium">{link.name}</span>
              {active && (
                <motion.div layoutId="activeIndicator" className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20" initial={false} transition={{ type: "spring", stiffness: 380, damping: 30 }} />
              )}
              {!active && isHovered && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 bg-muted/50 rounded-xl" transition={{ duration: 0.2 }} />
              )}
            </div>
          </Link>
        )
      })}
    </nav>
  )

const MobileNavigation = ({ onClose }: { onClose?: () => void }) => (
  <nav className="flex flex-col gap-2">
    {navLinks.map((link, index) => {
      const active = isLinkActive(link.href)
      const IconComponent = link.icon

      return (
        <motion.div
          key={link.href}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link
            href={link.href}
            onClick={() => {
              onClose?.() // ✅ ferme le drawer
            }}
            className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden ${
              active
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-foreground hover:bg-muted/50 border border-transparent"
            }`}
          >
            {/* ... ton contenu inchangé ... */}
            <div className={`relative flex items-center justify-center w-10 h-10 rounded-lg ${
              active ? "bg-primary/20" : "bg-muted/50 group-hover:bg-muted"
            } transition-colors duration-300`}>
              <IconComponent className="h-5 w-5 relative z-10" strokeWidth={active ? 2.5 : 2} />
            </div>

            <div className="flex-1 relative z-10">
              <p className={`font-semibold text-sm ${active ? "text-primary" : ""}`}>
                {link.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {link.description}
              </p>
            </div>
          </Link>
        </motion.div>
      )
    })}
  </nav>
)


  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${isScrolled ? "border-border/60 bg-background/70 backdrop-blur-xl shadow-lg shadow-black/5" : "border-border/40 bg-background/80 backdrop-blur-md shadow-sm"} supports-[backdrop-filter]:bg-background/60`}>
      <div className="flex h-16 w-full items-center px-4 md:px-8">
        
        {/* LOGO SECTION */}
        <Link href="/" className="flex items-center space-x-2.5 transition-all duration-300 hover:opacity-90 group mr-12">
          <div className="relative h-28 w-28 transition-all duration-300 group-hover:scale-125 group-hover:rotate-3 ">
            <Image
              src="/logo/logo_pki.png"
              alt="PokéIndex"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="hidden font-bold sm:inline-block text-lg tracking-tight -ml-5">
            Poké<span className="text-primary -ml-0.25">index</span>
          </span>
        </Link>

        <DesktopNavigation />
        <div className="flex-1" />

        <div className="flex items-center gap-2 md:gap-3">
          <IndexBadge />
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 hover:scale-105 hidden sm:flex">
            <Icons.search className="h-4 w-4" />
          </Button>
          <ThemeToggle />

          <div className="hidden lg:flex items-center gap-2 ml-2">
            {!loading && !user && (
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-border/50 hover:bg-primary/5 transition-all duration-300" onClick={() => router.push("/login")}>
                Connexion
              </Button>
            )}
            {!loading && user && isAdmin && (
              <Button variant="ghost" size="sm" className="h-9 rounded-xl text-purple-500 hover:bg-purple-500/10 transition-all duration-300" onClick={() => router.push("/admin")}>
                <Icons.shield className="h-4 w-4 mr-1.5" />
                Admin
              </Button>
            )}
            {!loading && user && isPro && !isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                disabled={portalLoading}
                className="h-9 rounded-xl text-primary hover:bg-primary/10 transition-all duration-300"
                onClick={handlePortal}
              >
                {portalLoading ? (
                  <Icons.loader className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Icons.creditCard className="h-4 w-4 mr-1.5" />
                )}
                Abonnement
              </Button>
            )}
            {!loading && user && (
              <Button size="sm" className="h-9 px-5 font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90" onClick={async () => { await signOut(auth); router.push("/"); }}>
                Déconnexion
              </Button>
            )}
          </div>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9 rounded-xl hover:bg-muted"
              >
                <Icons.menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] sm:w-[380px] p-0 border-r border-border/50">
              <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 border-b border-border/50">
                <SheetHeader>
                  <SheetTitle className="flex items-center text-lg font-bold">
                    <div className="relative h-12 w-12">
                      <Image src="/logo/logo_pki.png" alt="Logo" fill className="object-contain" />
                    </div>
                    <span>Pokéindex</span>
                  </SheetTitle>
                </SheetHeader>
              </div>
              <div className="flex flex-col h-[calc(100%-88px)]">
                <div className="flex-1 p-6 overflow-y-auto">
                        <MobileNavigation onClose={() => setSheetOpen(false)} />
                </div>
                <div className="p-6 border-t border-border/50 bg-muted/20 space-y-3">
                  {!loading && !user ? (
                    <Button className="w-full h-12 font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90" onClick={() => router.push("/login")}>Connexion</Button>
                  ) : (
                    <>
                      {isAdmin && (
                        <Button variant="outline" className="w-full h-12 rounded-xl text-purple-500 border-purple-500/30 hover:bg-purple-500/10" onClick={() => router.push("/admin")}>
                          <Icons.shield className="h-4 w-4 mr-2" />
                          Administration
                        </Button>
                      )}
                      {isPro && !isAdmin && (
                        <Button
                          variant="outline"
                          disabled={portalLoading}
                          className="w-full h-12 rounded-xl text-primary border-primary/30 hover:bg-primary/10"
                          onClick={handlePortal}
                        >
                          {portalLoading ? (
                            <Icons.loader className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Icons.creditCard className="h-4 w-4 mr-2" />
                          )}
                          Gérer mon abonnement
                        </Button>
                      )}
                      <Button variant="outline" className="w-full h-12 rounded-xl" onClick={async () => { await signOut(auth); router.push("/"); }}>Déconnexion</Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}