"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "@/components/icons";
import { useCookieConsent } from "@/context/CookieConsentContext";

const STORAGE_KEY = "floating-badge-dismissed";

export default function FloatingGuidesBadge() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Start true to avoid flash
  const { resetConsent } = useCookieConsent();
  const containerRef = useRef<HTMLDivElement>(null);

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === "true");
  }, []);

  // Scroll visibility
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside to close (mobile)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isExpanded]);

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-3 bottom-20 sm:right-6 sm:bottom-32 z-40"
          onMouseEnter={() => setIsExpanded(true)}
          onMouseLeave={() => setIsExpanded(false)}
        >
          {/* Glow effect behind container */}
          <div
            className={`absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl blur-xl transition-opacity ${isExpanded ? "opacity-100" : "opacity-60"}`}
          />

          {/* Main container */}
          <div
            className={`
              relative bg-background/95 backdrop-blur-xl border border-border/50
              rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden
              transition-all duration-200 ease-out
              ${isExpanded ? "w-56 sm:w-60" : "w-14 sm:w-16"}
            `}
          >
            <div className="p-2.5 sm:p-3">
              {/* Header - clickable on mobile */}
              <button
                onClick={handleToggle}
                className="flex items-center gap-2 sm:gap-3 w-full text-left"
              >
                <div className="relative flex-shrink-0">
                  {/* Halo effect around icon */}
                  <div className="absolute -inset-1.5 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-primary blur-sm opacity-80 animate-[pulse_1.5s_ease-in-out_infinite]" />
                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                    <Icons.bookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>

                {/* Title - visible when expanded */}
                <span
                  className={`text-sm font-semibold whitespace-nowrap transition-opacity duration-150 ${isExpanded ? "opacity-100" : "opacity-0"}`}
                >
                  Ressources
                </span>

                {/* Close icon when expanded */}
                <Icons.x
                  className={`w-4 h-4 ml-auto text-muted-foreground transition-opacity duration-150 ${isExpanded ? "opacity-100" : "opacity-0"}`}
                />
              </button>

              {/* Links */}
              <div
                className={`
                  overflow-hidden transition-all duration-200 ease-out
                  ${isExpanded ? "max-h-56 opacity-100 mt-2.5 sm:mt-3" : "max-h-0 opacity-0 mt-0"}
                `}
              >
                <div className="overflow-hidden">
                  <div className="pt-2.5 sm:pt-3 border-t border-border/50 space-y-1">
                    <Link
                      href="/investir-pokemon"
                      className="flex items-center gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-xl hover:bg-muted/50 active:bg-muted/70 transition-colors"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icons.trendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">Investir</p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground">Guide complet</p>
                      </div>
                      <Icons.chevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    </Link>

                    <Link
                      href="/historique-prix-pokemon"
                      className="flex items-center gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-xl hover:bg-muted/50 active:bg-muted/70 transition-colors"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Icons.barChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">Historique prix</p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground">Graphiques & tendances</p>
                      </div>
                      <Icons.chevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    </Link>

                    {/* Cookies button */}
                    <button
                      onClick={resetConsent}
                      className="flex items-center gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-xl hover:bg-muted/50 active:bg-muted/70 transition-colors w-full text-left"
                    >
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Icons.settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">Cookies</p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground">Gérer les préférences</p>
                      </div>
                    </button>

                    {/* Dismiss button */}
                    <button
                      onClick={handleDismiss}
                      className="flex items-center justify-center gap-2 p-1.5 sm:p-2 rounded-xl hover:bg-destructive/10 active:bg-destructive/20 transition-colors w-full text-muted-foreground hover:text-destructive text-xs"
                    >
                      <Icons.x className="w-3 h-3" />
                      <span>Masquer ce badge</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
