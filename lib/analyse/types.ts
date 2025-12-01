export type PricePoint = { date: string; price: number };

export type Item = {
  name: string;
  releaseDate: string;
  bloc: string;
  image?: string;
  type:
    | "ETB" | "Display" | "Demi-Display" | "Tri-Pack"
    | "UPC" | "Artset" | "Bundle";
  retailPrice?: number;
  prices?: PricePoint[];
};
