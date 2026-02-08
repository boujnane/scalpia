export type PricePoint = { date: string; price: number; sourceUrl?: string | null };

export type Item = {
  name: string;
  releaseDate: string;
  bloc: string;
  image?: string;
  type:
    | "ETB" | "Display" | "Demi-Display" | "Tri-Pack"
    | "UPC" | "Artset" | "Bundle" | "Coffret Collection Poster"
    | "Coffret" | "Pokébox";
  retailPrice?: number;
  prices?: PricePoint[];
};


export type Point = { 
  date: number; // Timestamp (getTime())
  price: number;
};
