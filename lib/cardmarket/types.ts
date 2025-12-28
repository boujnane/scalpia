// lib/cardmarket/types.ts

export interface CMSet {
    id: number
    name: string
    slug: string
    logo?: string
    released_at?: string
    series?: {
      name: string
    }
    game?: string
  }

  export type GradedPrices = {
    psa?: Record<string, number>
    cgc?: Record<string, number>
    bgs?: Record<string, number>
  }
  
  export type Prices = {
    fr?: number
    avg7?: number
    graded?: GradedPrices
  }
  
  export interface CMCard {
  id: number;
  cardmarketId?: number;
  name: string;
  rarity?: string;
  card_number?: string;
  image?: string;
  prices?: {
    fr?: number;
    avg7?: number;
    graded?: {
      psa?: Record<string, number>;
      cgc?: Record<string, number>;
      bgs?: Record<string, number>;
    };
  };
  episode: { name: string };
 cardmarket_url?: string | null;  // ✅ ici
  tcggo_url?: string | null;    
}

export interface CMSet {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  series?: { name: string };
}