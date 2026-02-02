"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTutorial } from "@/context/TutorialContext";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TooltipStyle = {
  top: number;
  left: number;
  arrowPosition: "top" | "bottom" | "left" | "right";
  arrowOffset: number;
  width: number;
};

export function TutorialOverlay() {
  const { isActive, currentStep, currentStepIndex, steps, nextStep, skipTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<TooltipStyle>({
    top: 0,
    left: 0,
    arrowPosition: "top",
    arrowOffset: 50,
    width: 360
  });

  // Prevent scroll loop
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getScrollParent = (node: Element | null): Element | null => {
    if (!node) return null;
    let parent = node.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      const overflowX = style.overflowX;
      const isScrollable =
        (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") ||
        (overflowX === "auto" || overflowX === "scroll" || overflowX === "overlay");
      if (isScrollable && parent.scrollHeight > parent.clientHeight) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  };

  const scrollToTarget = (element: Element, topSafe: number) => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth";
    const scrollParent = getScrollParent(element);
    const elementRect = element.getBoundingClientRect();

    if (!scrollParent || scrollParent === document.documentElement || scrollParent === document.body) {
      const currentTop = window.scrollY || window.pageYOffset;
      const targetTop = currentTop + elementRect.top - topSafe - 12;
      window.scrollTo({ top: Math.max(0, targetTop), behavior });
      return;
    }

    const parentRect = scrollParent.getBoundingClientRect();
    const currentTop = scrollParent.scrollTop;
    const targetTop = currentTop + (elementRect.top - parentRect.top) - topSafe - 12;
    scrollParent.scrollTo({ top: Math.max(0, targetTop), behavior });
  };

  const updateTargetPosition = useCallback(() => {
    if (!currentStep) return;

    const element = document.querySelector(currentStep.target);
    if (!element) {
      setTargetRect(null);
      return;
    }

    const rect = element.getBoundingClientRect();

    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const nav = document.querySelector("[data-tutorial='navigation']");
    const navHeight = nav instanceof HTMLElement ? nav.getBoundingClientRect().height : 0;
    const isNavTarget = element instanceof HTMLElement
      ? element.closest("[data-tutorial='navigation']") !== null
      : false;
    const topSafe = (isNavTarget ? 0 : navHeight) + 12;
    const bottomSafe = 12;

    const isFullyInView =
      rect.top >= topSafe &&
      rect.bottom <= viewportHeight - bottomSafe;

    if (!isFullyInView && !isScrollingRef.current) {
      // Set flag to prevent re-triggering scroll while we animate
      isScrollingRef.current = true;

      scrollToTarget(element, topSafe);

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Reset flag after scroll animation completes
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        updateTargetPosition();
      }, 700);
    }

    const padding = 8;
    setTargetRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculer position du tooltip
    const position = currentStep.position || "bottom";
    const tooltipWidth = Math.min(360, viewportWidth - 32);
    const tooltipHeight = 180;
    const gap = 20;

    let tooltipTop = 0;
    let tooltipLeft = 0;
    let arrowPos: "top" | "bottom" | "left" | "right" = "top";

    switch (position) {
      case "top":
        tooltipTop = rect.top - tooltipHeight - gap;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrowPos = "bottom";
        break;
      case "bottom":
        tooltipTop = rect.bottom + gap;
        tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        arrowPos = "top";
        break;
      case "left":
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
        tooltipLeft = rect.left - tooltipWidth - gap;
        arrowPos = "right";
        break;
      case "right":
        tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2;
        tooltipLeft = rect.right + gap;
        arrowPos = "left";
        break;
    }

    // Garder dans la fenêtre
    const clampedLeft = Math.max(16, Math.min(tooltipLeft, viewportWidth - tooltipWidth - 16));
    const clampedTop = Math.max(16, Math.min(tooltipTop, viewportHeight - tooltipHeight - 16));

    // Calculer offset de la flèche
    const arrowOffset = position === "top" || position === "bottom"
      ? Math.max(20, Math.min(80, 50 + (tooltipLeft - clampedLeft) / tooltipWidth * 100))
      : 50;

    setTooltipStyle({
      top: clampedTop,
      left: clampedLeft,
      arrowPosition: arrowPos,
      arrowOffset,
      width: tooltipWidth
    });
  }, [currentStep]);

  // Navigation clavier
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skipTutorial();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        nextStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, nextStep, skipTutorial]);

  useEffect(() => {
    if (!isActive || !currentStep) return;

    // Petit délai pour laisser le DOM se stabiliser
    const timer = setTimeout(updateTargetPosition, 100);

    // Throttled scroll handler to prevent performance issues
    let scrollRafId: number | null = null;
    const handleScroll = () => {
      if (scrollRafId) return;
      scrollRafId = requestAnimationFrame(() => {
        updateTargetPosition();
        scrollRafId = null;
      });
    };

    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", handleScroll, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateTargetPosition);
      window.visualViewport.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      clearTimeout(timer);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (scrollRafId) {
        cancelAnimationFrame(scrollRafId);
      }
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", handleScroll);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateTargetPosition);
        window.visualViewport.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isActive, currentStep, currentStepIndex, updateTargetPosition]);

  // Force scroll to the current step when it changes (even if partially visible)
  useEffect(() => {
    if (!isActive || !currentStep) return;

    let attempts = 0;
    let cancelled = false;

    const tryScroll = () => {
      if (cancelled) return;
      const element = document.querySelector(currentStep.target);
      if (!element) {
        if (attempts < 6) {
          attempts += 1;
          setTimeout(tryScroll, 120);
        }
        return;
      }

      const nav = document.querySelector("[data-tutorial='navigation']");
      const navHeight = nav instanceof HTMLElement ? nav.getBoundingClientRect().height : 0;
      const isNavTarget = element instanceof HTMLElement
        ? element.closest("[data-tutorial='navigation']") !== null
        : false;
      const topSafe = (isNavTarget ? 0 : navHeight) + 12;

      scrollToTarget(element, topSafe);
      updateTargetPosition();
    };

    const kickoff = setTimeout(tryScroll, 60);
    return () => {
      cancelled = true;
      clearTimeout(kickoff);
    };
  }, [isActive, currentStep, currentStepIndex, updateTargetPosition]);

  if (!isActive || !currentStep) return null;

  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="tutorial-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Overlay avec spotlight */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <motion.rect
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  x={targetRect.left}
                  y={targetRect.top}
                  width={targetRect.width}
                  height={targetRect.height}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Fond sombre */}
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.80)"
            mask="url(#spotlight-mask)"
          />

          {/* Bordure lumineuse autour du spotlight */}
          {targetRect && (
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              x={targetRect.left - 2}
              y={targetRect.top - 2}
              width={targetRect.width + 4}
              height={targetRect.height + 4}
              rx="14"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              filter="url(#glow)"
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Zone cliquable pour fermer */}
        <div
          className="absolute inset-0"
          onClick={skipTutorial}
          aria-label="Fermer le tutoriel"
        />

        {/* Tooltip Card */}
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed z-[101]"
          style={{ top: tooltipStyle.top, left: tooltipStyle.left, width: tooltipStyle.width }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow */}
          <div
            className={`absolute w-3 h-3 bg-card border-border rotate-45 ${
              tooltipStyle.arrowPosition === "top"
                ? "-top-1.5 border-l border-t"
                : tooltipStyle.arrowPosition === "bottom"
                ? "-bottom-1.5 border-r border-b"
                : tooltipStyle.arrowPosition === "left"
                ? "-left-1.5 border-l border-b"
                : "-right-1.5 border-r border-t"
            }`}
            style={{
              [tooltipStyle.arrowPosition === "top" || tooltipStyle.arrowPosition === "bottom" ? "left" : "top"]:
                `${tooltipStyle.arrowOffset}%`,
              transform: `translateX(-50%) rotate(45deg)`
            }}
          />

          {/* Card Content */}
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {currentStepIndex + 1}
                  </span>
                  <h3 className="font-semibold text-lg text-foreground leading-tight">
                    {currentStep.title}
                  </h3>
                </div>
                <button
                  onClick={skipTutorial}
                  className="shrink-0 p-1.5 -m-1 hover:bg-muted rounded-lg transition-colors group"
                  aria-label="Fermer le tutoriel"
                >
                  <X className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                {currentStep.description}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between">
                {/* Step counter */}
                <span className="text-xs text-muted-foreground">
                  {currentStepIndex + 1} sur {steps.length}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={skipTutorial}
                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Passer
                  </button>
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="gap-1.5 rounded-lg"
                  >
                    {isLastStep ? "Terminé" : "Suivant"}
                    {isLastStep ? null : <ArrowRight className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
