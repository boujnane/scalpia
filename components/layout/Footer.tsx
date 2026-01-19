"use client"

import Link from "next/link"
import Image from "next/image"
import { Icons } from "@/components/icons"
import { useCookieConsent } from "@/context/CookieConsentContext"

export default function Footer() {
  const { resetConsent } = useCookieConsent()

  return (
    <footer className="border-t border-border/40 bg-background/70 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          
          {/* Brand & Description */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 group">
              <div className="relative h-32 w-32 transition-transform duration-300 group-hover:scale-115">
                <Image
                  src="/logo/logo_pki.png"
                  alt="PokéIndex Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="leading-tight -ml-4">
                <div className="text-lg font-bold tracking-tight">
                  Poké<span className="text-primary">index</span>
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  L&apos;index de référence du scellé Pokémon
                </div>
              </div>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Navigation secondaire">
              <Link
                href="/a-propos"
                prefetch={false}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                À propos
              </Link>

              <a 
                href="https://www.tcgdex.net" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                API TCGdex
                <Icons.external className="h-3 w-3" />
              </a>

              <Link
                href="/contact"
                prefetch={false}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Contact
              </Link>

              {/* ✅ CGU */}
              <Link
                href="/cgu"
                prefetch={false}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                CGU
              </Link>

              {/* ✅ Mentions légales */}
              <Link
                href="/mentions-legales"
                prefetch={false}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Mentions légales
              </Link>

              <button
                onClick={resetConsent}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                type="button"
              >
                Gérer les cookies
              </button>
            </nav>
          </div>

          {/* Divider mobile */}
          <div className="h-px w-full bg-border/40 sm:hidden" />

          {/* Meta & Credits */}
          <div className="flex flex-col sm:items-end gap-1.5 sm:text-right">
            <div className="text-sm font-medium text-muted-foreground">
              © {new Date().getFullYear()} Pokéindex
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              V1.0.0 · Ady Boujnane
            </div>
            <div className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-semibold mt-1">
              Propulsé par Bubo
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
