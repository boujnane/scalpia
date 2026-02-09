"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const TrendingCarousel = dynamic(() => import("@/components/home/TrendingCarousel"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-border/50 bg-background/60 p-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl hidden lg:block" />
      </div>
    </div>
  ),
});

export const HomeInsightsSection = dynamic(() => import("@/components/home/HomeInsightsSection"), {
  ssr: false,
  loading: () => (
    <section className="py-16 sm:py-20 border-t border-border/50 bg-muted/10">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </section>
  ),
});

export const FloatingGuidesBadge = dynamic(() => import("@/components/home/FloatingGuidesBadge"), {
  ssr: false,
});
