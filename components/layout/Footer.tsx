"use client"

import { Icons } from "@/components/icons"

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/70 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="
                flex h-9 w-9 items-center justify-center rounded-xl
                bg-gradient-to-br from-primary/20 to-primary/10
                border border-primary/20
              "
              aria-hidden="true"
            >
              <Icons.LineChart
                className="h-4 w-4 text-primary"
                strokeWidth={2.5}
              />
            </div>

            <div className="leading-tight">
              <div className="font-bold tracking-tight">
                Poké<span className="text-primary">index</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Index des prix Pokémon
              </div>
            </div>
          </div>

          {/* Divider mobile */}
          <div className="h-px w-full bg-border/40 sm:hidden" />

          {/* Meta */}
          <div className="flex flex-col sm:items-end gap-1 text-center sm:text-right">
            <div className="text-xs sm:text-sm text-muted-foreground">
              © {new Date().getFullYear()} Pokéindex
            </div>
            <div className="text-[11px] text-muted-foreground/80">
              Site en construction · Ady Boujnane
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
