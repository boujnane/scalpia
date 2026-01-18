"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, FreeMode, Autoplay } from "swiper/modules";

import { useAnalyseItems } from "@/hooks/useAnalyseItems";
import { getChartAnalysis } from "@/lib/analyse/getChartAnalysis";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

type TrendingItem = {
  name: string;
  type: string;
  image?: string;
  lastPrice: number | null;
  trend7d: number | null;
};

export default function TrendingCarousel() {
  const prefersReducedMotion = useReducedMotion();
  const { items, loading, error } = useAnalyseItems();

  const trendingItems = useMemo(() => {
    if (!items || items.length === 0) return [];

    const itemsWithTrend: TrendingItem[] = items
      .map((item) => {
        const analysis = getChartAnalysis(item);
        return {
          name: item.name,
          type: item.type,
          image: item.image,
          lastPrice: analysis.lastPrice,
          trend7d: analysis.trend7d,
        };
      })
      .filter((it) => it.trend7d !== null && it.lastPrice !== null);

    // Biggest variations first
    itemsWithTrend.sort((a, b) => Math.abs((b.trend7d ?? 0)) - Math.abs((a.trend7d ?? 0)));

    return itemsWithTrend.slice(0, 10); // un peu plus pour loop + autoplay
  }, [items]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 space-y-4"
          >
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error || trendingItems.length === 0) {
    return null;
  }

  const enableLoop = trendingItems.length >= 6 && !prefersReducedMotion;

  return (
    <Swiper
      modules={[Navigation, Pagination, FreeMode, Autoplay]}
      spaceBetween={16}
      slidesPerView={1.2}
      freeMode={{ enabled: true, sticky: false }}
      pagination={{ clickable: true, dynamicBullets: true }}
      navigation={{ enabled: true }}
      loop={enableLoop}
      speed={prefersReducedMotion ? 0 : 900} // transition plus “smooth”
      autoplay={
        prefersReducedMotion
          ? false
          : {
              delay: 2200,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
              stopOnLastSlide: false,
            }
      }
      breakpoints={{
        480: { slidesPerView: 1.5, spaceBetween: 16 },
        640: { slidesPerView: 2.5, spaceBetween: 20 },
        1024: { slidesPerView: 4, spaceBetween: 24, navigation: { enabled: true } },
      }}
      className="trending-carousel !pb-12"
    >
      {trendingItems.map((item, index) => {
        const trendColor =
          item.trend7d === null || Math.abs(item.trend7d) <= 0.5
            ? "text-muted-foreground bg-muted/50"
            : item.trend7d > 0.5
            ? "text-success bg-success/10"
            : "text-destructive bg-destructive/10";

        const TrendIcon =
          item.trend7d === null || Math.abs(item.trend7d) <= 0.5
            ? Icons.minus
            : item.trend7d > 0.5
            ? Icons.trendingUp
            : Icons.trendingDown;

        return (
          <SwiperSlide key={`${item.type}-${item.name}-${index}`}>
            <Link href="/analyse?tab=products" className="block h-full">
              <div
                className="
                  group h-full border border-border rounded-xl
                  bg-card overflow-hidden
                  hover:shadow-lg hover:border-primary/50
                  transition-all duration-300 cursor-pointer
                "
              >
                {/* Image */}
                <div className="relative h-32 sm:h-36 bg-gradient-to-br from-secondary/30 to-secondary/10 overflow-hidden">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={`${item.type} ${item.name}`}
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      priority={index < 2} // petit boost perf pour les 2 premiers
                    />
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Type + Name */}
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {item.type}
                    </span>
                    <h3 className="font-semibold text-foreground line-clamp-2 text-sm sm:text-base mt-0.5">
                      {item.name}
                    </h3>
                  </div>

                  {/* Price and Trend */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Price */}
                    <span className="text-lg font-bold text-primary">
                      {item.lastPrice?.toFixed(2)} €
                    </span>

                    {/* Trend Badge */}
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${trendColor}`}
                      aria-label="Variation 7 jours"
                    >
                      <TrendIcon className="h-3 w-3" />
                      <span>
                        {item.trend7d !== null
                          ? `${item.trend7d > 0 ? "+" : ""}${item.trend7d.toFixed(1)}%`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}
