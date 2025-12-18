// types.ts

import { Card } from "@tcgdex/sdk";

// =========================================================
// Interfaces de Prix (Pricing)
// =========================================================

/**
 * Structure de base pour un variant de prix (utilisé par TCGPlayer).
 */
export interface PriceVariant {
    lowPrice: number | null;
    midPrice: number | null;
    highPrice: number | null;
    marketPrice: number | null;
    directLowPrice: number | null;
}

/**
 * Structure des prix TCGPlayer.
 */
export interface TCGPlayerPricing {
    updated: number;
    unit: number; // 1 pour USD
    normal: PriceVariant | null;
    holofoil: PriceVariant | null;
    'reverse-holofoil': PriceVariant | null;
    '1st-edition': PriceVariant | null;
    '1st-edition-holofoil': PriceVariant | null;
    unlimited: PriceVariant | null;
    'unlimited-holofoil': PriceVariant | null;
}

/**
 * Structure des prix Cardmarket (Marché Européen).
 */
export interface CardmarketPricing {
    updated: number | null;
    unit: number | null; // 1 pour EUR
    avg: number | null;
    low: number | null;
    trend: number | null;
    avg1: number | null;
    avg7: number | null;
    avg30: number | null;
    'avg-holo': number | null;
    'low-holo': number | null;
    'trend-holo': number | null;
    'avg1-holo': number | null;
    'avg7-holo': number | null;
    'avg30-holo': number | null;
}


/**
 * Structure globale des prix de la carte.
 */
export interface CardPricing {
    tcgplayer: TCGPlayerPricing | null;
    cardmarket: CardmarketPricing | null;
    'ebay-fr'?: EbayPricing
}

export type EbayPricing = {
    updated: string
    unit: 'EUR' | 'USD'
    avg1?: number
    avg7?: number
    avg28?: number
    low?: number
    high?: number
    listings?: number
  }
  

// =========================================================
// Interface de la Carte Étendue
// =========================================================

/**
 * Interface pour étendre le type Card du SDK TCGdex (assertion de type).
 * Inclut les propriétés 'images' et 'pricing' qui peuvent être manquantes ou mal typées dans le SDK d'origine.
 */
export interface TCGdexCardExtended extends Card {
    // Correction de type pour l'image
    images: {
        small: string;
        large: string;
    } | null;
    // Ajout du pricing typé
    pricing: CardPricing | null; 
}

