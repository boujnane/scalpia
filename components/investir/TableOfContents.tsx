"use client";

import { useState, useEffect } from "react";
import { ChevronDown, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TocItem {
  id: string;
  label: string;
  icon?: string;
}

const tocItems: TocItem[] = [
  { id: "marche", label: "Le marché aujourd'hui" },
  { id: "produits", label: "Produits rentables" },
  { id: "performances", label: "Performances historiques" },
  { id: "risques", label: "Risques" },
  { id: "fr-vs-en", label: "Marchés par langue" },
  { id: "grading", label: "Grading" },
  { id: "collection-vs-invest", label: "Collection vs Investissement" },
  { id: "conclusion", label: "Conclusion" },
  { id: "faq", label: "FAQ" },
];

export function TableOfContents() {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0% -70% 0%",
        threshold: 0,
      }
    );

    tocItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Header height
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile: Dropdown */}
      <div className="lg:hidden sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 -mx-4 px-4 py-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Sommaire
          </span>
          <ChevronDown
            className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")}
          />
        </Button>
        {isOpen && (
          <nav className="mt-2 p-2 bg-card rounded-lg border border-border/50 shadow-lg">
            <ul className="space-y-1">
              {tocItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                      activeId === item.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* Desktop: Sticky sidebar */}
      <aside className="hidden lg:block fixed left-[max(1rem,calc(50%-45rem))] top-24 w-52 max-h-[calc(100vh-8rem)] overflow-y-auto z-50">
        <nav className="p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Sommaire
          </p>
          <ul className="space-y-1">
            {tocItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors",
                    activeId === item.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
