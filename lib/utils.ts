import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { LBCOffer } from "@/types";
import { blocImages } from "./analyse/blocImages";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check(); // check initial
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}

export const getAssetUrl = (baseUrl: string | null | undefined, extension: 'png' | 'webp' | 'jpg' = 'webp'): string | null => {
  if (!baseUrl) return null;
  return `${baseUrl}.${extension}`;
};


/**
 * Reconstruit l'URL d'une image haute résolution d'une carte TCGdex.
 * @param id Exemple : "swsh3-136"
 * @param localId Exemple : "136"
 * @param ext Extension : "png" | "webp"
 * @param lang Langue : "fr" | "en"
 */
export const getCardImageUrl = (
  id: string,       // ex: "swsh3-136"
  localId: string,  // ex: "136"
  ext: 'png' | 'webp' = 'png',
  lang: 'fr' | 'en' = 'fr'
): string => {
  // id tronqué = partie alphabétique avant le chiffre → dossier principal
  let idTronque = id.match(/^[a-z]+/i)?.[0] ?? ''

  // idSet = partie avant le tiret
  const idSet = id.split('-')[0]

  // 🔹 Condition spéciale : si idTronque == "svp" ET idSet == "svp" alors idTronque devient "sv"
  if (idTronque.toLowerCase() === 'svp' && idSet.toLowerCase() === 'svp') {
    idTronque = 'sv'
  }

  const url = `https://assets.tcgdex.net/${lang}/${idTronque}/${idSet}/${localId}/high.${ext}`

  console.log(url)
  return url
}


export const parseLBCPrice = (price: string): number => {
  if (!price) return NaN;
  return Number(price.replace(/[^\d,]/g, "").replace(",", "."));
};

export const normalizeLBCOffers = (offers: any[]): LBCOffer[] => {
  if (!Array.isArray(offers)) return [];

  return offers
    .map((o) => ({
      title: o.title ?? "",
      price: String(o.price ?? ""),
      location: o.location ?? "",
      category: o.category ?? "",
      link: o.link ?? null,
      image: o.image ?? null,
    }))
    .filter(
      (o) =>
        o.link &&
        o.price &&
        !Number.isNaN(parseLBCPrice(o.price))
    );
};

export function aggregatePricesByDay(
  prices: { date: string; price: number }[]
): { date: string; price: number }[] {
  
  // Validation des prix
  const validPrices = prices
    .map(p => {
      const t = new Date(p.date).getTime();
      if (isNaN(t) || typeof p.price !== "number") return null;
      return { date: p.date, price: p.price };
    })
    .filter(Boolean) as { date: string; price: number }[];

  // Groupement par jour (YYYY-MM-DD)
  const dailyPrices = new Map<string, number[]>();
  validPrices.forEach(p => {
    const dateKey = new Date(p.date).toISOString().split("T")[0];
    if (!dailyPrices.has(dateKey)) dailyPrices.set(dateKey, []);
    dailyPrices.get(dateKey)!.push(p.price);
  });

  // Calculer la médiane par jour
  const aggregated = Array.from(dailyPrices.entries())
    .map(([dateKey, prices]) => {
      prices.sort((a, b) => a - b);
      const mid = Math.floor(prices.length / 2);
      const median =
        prices.length % 2 !== 0
          ? prices[mid]
          : (prices[mid - 1] + prices[mid]) / 2;
      
      return { date: dateKey, price: median };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return aggregated;
}

/**
 * Calcule une trend basée sur l'évolution des prix
 */
export function calculateTrend(
  prices: { date: string; price: number }[],
  daysBack?: number  // undefined = tout l'historique
): { trend: "up" | "down" | "stable"; variation: number } {
  
  if (prices.length < 2) {
    return { trend: "stable", variation: 0 };
  }

  // Filtrer par période si spécifié
  let filteredPrices = prices;
  if (daysBack !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];
    
    filteredPrices = prices.filter(p => p.date >= cutoffStr);
  }

  if (filteredPrices.length < 2) {
    return { trend: "stable", variation: 0 };
  }

  const firstPrice = filteredPrices[0].price;
  const lastPrice = filteredPrices[filteredPrices.length - 1].price;
  const variation = (lastPrice - firstPrice) / firstPrice;

  let trend: "up" | "down" | "stable" = "stable";
  if (variation > 0.05) trend = "up";       // +5%
  else if (variation < -0.05) trend = "down"; // -5%

  return { trend, variation };
}

export function getBlocImage(bloc?: string) {
  if (!bloc) return null;
  return blocImages[bloc] ?? null;
}