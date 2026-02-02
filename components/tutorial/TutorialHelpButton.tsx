"use client";

import { HelpCircle } from "lucide-react";
import { useTutorial, type TutorialStep } from "@/context/TutorialContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TutorialHelpButtonProps {
  steps: TutorialStep[];
  tutorialKey: string;
  label?: string;
  className?: string;
}

export function TutorialHelpButton({
  steps,
  tutorialKey,
  label = "Revoir le guide",
  className = "",
}: TutorialHelpButtonProps) {
  const { startTutorial, isActive } = useTutorial();

  const handleClick = () => {
    if (isActive) return;
    startTutorial(steps, tutorialKey);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            disabled={isActive}
            className={`
              inline-flex items-center justify-center gap-1.5
              px-2.5 py-1.5 rounded-lg
              text-xs font-medium
              text-muted-foreground hover:text-foreground
              bg-muted/50 hover:bg-muted
              border border-transparent hover:border-border
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            aria-label={label}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
