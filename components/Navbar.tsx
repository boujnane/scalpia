// components/Navbar.tsx
'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons" 
import { ThemeToggle } from "./theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"

const navLinks = [
  { 
    name: "Rechercher", 
    href: "/rechercher", 
    icon: Icons.LineChart,
    description: "Comparez sur le marché secondaire"
  },
  { 
    name: "Analyser", 
    href: "/analyse", 
    icon: Icons.wallet,
    description: "Explorer les données de marché"
  },
  { 
    name: "Cartes", 
    href: "/tcgdex", 
    icon: Icons.zap,
    description: "Parcourir les cartes"
  },
]

export function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)

  // Détection du scroll pour effet dynamique
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  // Navigation Desktop avec animations
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
            <div className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl
              transition-all duration-300 ease-out
              ${active 
                ? 'text-primary font-semibold' 
                : 'text-muted-foreground hover:text-foreground'
              }
            `}>
              <IconComponent 
                className={`
                  h-4 w-4 transition-all duration-300
                  ${active ? 'scale-110' : 'group-hover:scale-110'}
                `} 
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-sm font-medium">{link.name}</span>
              
              {/* Indicateur actif animé */}
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                  initial={false}
                  transition={{ 
                    type: "spring", 
                    stiffness: 380, 
                    damping: 30 
                  }}
                />
              )}
              
              {/* Effet hover */}
              {!active && isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-muted/50 rounded-xl"
                  transition={{ duration: 0.2 }}
                />
              )}
            </div>

            {/* Tooltip au hover */}
            <AnimatePresence>
              {isHovered && !active && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 
                    px-3 py-2 rounded-lg bg-popover border border-border
                    shadow-lg backdrop-blur-xl z-50 whitespace-nowrap"
                >
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 
                    w-2 h-2 bg-popover border-l border-t border-border 
                    rotate-45" 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        )
      })}
    </nav>
  )

  // Navigation Mobile améliorée
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
              onClick={onClose}
              className={`
                group flex items-center gap-3 px-4 py-3.5 rounded-xl
                transition-all duration-300 relative overflow-hidden
                ${active 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-foreground hover:bg-muted/50 border border-transparent'
                }
              `}
            >
              {/* Background gradient au hover */}
              <div className={`
                absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity duration-300
                ${active ? 'opacity-100' : ''}
              `} />
              
              <div className={`
                relative flex items-center justify-center w-10 h-10 rounded-lg
                ${active ? 'bg-primary/20' : 'bg-muted/50 group-hover:bg-muted'}
                transition-colors duration-300
              `}>
                <IconComponent 
                  className="h-5 w-5 relative z-10" 
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              
              <div className="flex-1 relative z-10">
                <p className={`font-semibold text-sm ${active ? 'text-primary' : ''}`}>
                  {link.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {link.description}
                </p>
              </div>

              {active && (
                <motion.div
                  layoutId="mobileActiveIndicator"
                  className="w-1 h-8 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          </motion.div>
        )
      })}
    </nav>
  )

  return (
    <header 
      className={`
        sticky top-0 z-50 w-full border-b transition-all duration-300
        ${isScrolled 
          ? 'border-border/60 bg-background/70 backdrop-blur-xl shadow-lg shadow-black/5' 
          : 'border-border/40 bg-background/80 backdrop-blur-md shadow-sm'
        }
        supports-[backdrop-filter]:bg-background/60
      `}
    >
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 md:px-8">

        {/* LOGO */}
        <Link 
          href="/" 
          className="flex items-center space-x-2.5 transition-all duration-300 hover:opacity-80 group mr-8"
        >
          <div className={`
            bg-gradient-to-br from-primary/20 to-primary/10 p-2 rounded-xl 
            border border-primary/20 shadow-sm shadow-primary/10
            transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/20
            group-hover:scale-105
          `}>
            <Icons.LineChart 
              className="h-5 w-5 text-primary transition-transform duration-300 group-hover:rotate-12" 
              strokeWidth={2.5} 
            />
          </div>
          <span className="hidden font-bold sm:inline-block text-lg tracking-tight">
            Poké<span className="text-primary">index</span>
          </span>
        </Link>

        {/* NAVIGATION DESKTOP */}
        <DesktopNavigation />

        {/* SPACER */}
        <div className="flex-1" />

        {/* ACTIONS DROITE */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* Market Indicator avec pulse */}
          <div className={`
            hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full 
            bg-success/10 border border-success/20 backdrop-blur-sm
            transition-all duration-300 hover:bg-success/15 hover:scale-105
          `}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
            </span>
            <span className="text-[11px] font-bold text-success uppercase tracking-wider">
              Market Open
            </span>
          </div>

          {/* Quick Search */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={`
              h-9 w-9 rounded-xl text-muted-foreground 
              hover:text-primary hover:bg-primary/10 
              transition-all duration-300 hover:scale-105
              hidden sm:flex
            `}
            aria-label="Rechercher"
          >
            <Icons.search className="h-4 w-4" />
          </Button>

          <ThemeToggle />

          {/* CTA Buttons Desktop */}
          <div className="hidden lg:flex items-center gap-2 ml-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={`
                h-9 rounded-xl border-border/50 
                hover:bg-primary/5 hover:text-primary hover:border-primary/30
                transition-all duration-300 hover:scale-105
              `}
            >
              Connexion
            </Button>
            <Button 
              size="sm" 
              className={`
                h-9 px-5 font-semibold rounded-xl
                shadow-lg shadow-primary/20 
                hover:shadow-xl hover:shadow-primary/30 
                transition-all duration-300 hover:scale-105
                bg-gradient-to-r from-primary to-primary/90
              `}
            >
              Commencer
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden h-9 w-9 rounded-xl hover:bg-muted"
                aria-label="Menu"
              >
                <Icons.menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-[320px] sm:w-[380px] p-0 border-r border-border/50"
            >
              {/* Header avec gradient */}
              <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 border-b border-border/50">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2.5 text-lg font-bold">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-2 rounded-xl border border-primary/20">
                      <Icons.LineChart className="h-5 w-5 text-primary" strokeWidth={2.5} />
                    </div>
                    <span>Pokéindex</span>
                  </SheetTitle>
                </SheetHeader>
              </div>

              <div className="flex flex-col h-[calc(100%-88px)]">
                {/* Navigation */}
                <div className="flex-1 p-6 overflow-y-auto">
                  <MobileNavigation />
                </div>

                {/* Actions en bas */}
                <div className="p-6 border-t border-border/50 bg-muted/20 space-y-3">
                  <Button 
                    size="lg" 
                    className={`
                      w-full h-12 font-semibold rounded-xl
                      shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30
                      bg-gradient-to-r from-primary to-primary/90
                      transition-all duration-300
                    `}
                  >
                    Commencer
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className={`
                      w-full h-12 rounded-xl border-border/50
                      hover:bg-primary/5 hover:text-primary hover:border-primary/30
                      transition-all duration-300
                    `}
                  >
                    Connexion
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

        </div>
      </div>
    </header>
  )
}