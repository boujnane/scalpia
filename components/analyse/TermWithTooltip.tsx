"use client";

import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getTermExplanation, TerminologyKey } from "@/lib/analyse/terminology";

interface TermWithTooltipProps {
  term: TerminologyKey;
  className?: string;
  showIcon?: boolean;
  useSimple?: boolean; // Si true, affiche le terme simple, sinon le terme technique
}

/**
 * Composant qui affiche un terme avec une info-bulle explicative
 * Permet de simplifier la terminologie pour le grand public
 */
export function TermWithTooltip({
  term,
  className = "",
  showIcon = true,
  useSimple = true,
}: TermWithTooltipProps) {
  const definition = getTermExplanation(term);
  const displayText = useSimple ? definition.simple : definition.technical;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 cursor-help ${className}`}>
            {displayText}
            {showIcon && <Info className="w-3.5 h-3.5 text-muted-foreground" />}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4 bg-popover text-popover-foreground" side="top">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-sm text-foreground">{definition.simple}</p>
              {useSimple && (
                <span className="text-xs text-muted-foreground italic">{definition.technical}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{definition.explanation}</p>
            {definition.example && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Exemple :</span> {definition.example}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
