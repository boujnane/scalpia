import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
  const idTronque = id.match(/^[a-z]+/i)?.[0] ?? ''
  // idSet = partie avant le tiret
  const idSet = id.split('-')[0]

  const url = `https://assets.tcgdex.net/${lang}/${idTronque}/${idSet}/${localId}/high.${ext}`
  console.log(url)  // 🔹 Log de l'URL générée
  return url
}
