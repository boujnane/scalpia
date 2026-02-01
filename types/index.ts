// file: types/index.ts
export type CleanSoldItem = {
    uuid?: string;
    title: string;
    price: string | number;
    thumbnail?: string;
    url?: string;
    soldDate?: string;
    condition?: string;
    seller?: string;
    };
    
    
export type FilterResult<T = any> = {
    valid: T[];
    rejected: { title: string; reason?: string }[];
    minPrice?: number | null;
  };
  
export type LBCOffer = {
    title: string;
    price: string; // prix brut (ex: "45 €")
    location: string;
    category: string;
    link: string | null;
    image?: string | null;
    rejected?: string;
    };

    export type ItemType =
  | "ETB"
  | "Display"
  | "Demi-Display"
  | "Tri-Pack"
  | "UPC"
  | "Artset"
  | "Bundle"
  | "Coffret Collection Poster"
  | "Coffret"
  | "Pokébox"
