import * as React from "react";

import { cn } from "@/lib/utils";

type BentoAccent = "neutral" | "primary" | "success" | "warning" | "purple" | "blue";

const accentClassName: Record<BentoAccent, string> = {
  neutral: "from-muted/60 via-transparent to-transparent",
  primary: "from-primary/20 via-transparent to-purple-500/10",
  success: "from-emerald-500/15 via-transparent to-transparent",
  warning: "from-amber-500/15 via-transparent to-transparent",
  purple: "from-purple-500/15 via-transparent to-transparent",
  blue: "from-sky-500/15 via-transparent to-transparent",
};

export function BentoGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-4 sm:gap-6", className)} {...props} />;
}

export function BentoTile({
  className,
  accent = "neutral",
  children,
  ...props
}: React.ComponentProps<"div"> & { accent?: BentoAccent }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br", accentClassName[accent])}
      />
      <div className="relative p-5 sm:p-6">{children}</div>
    </div>
  );
}

