export type PricePoint = {
    date: string; // ISO date string (YYYY-MM-DD or full ISO)
    price: number;
  };
  
  export type FinanceMetrics = {
    lastPrice: number | null;
    retail: number | null;
  
    premiumNow: number | null;     // last vs retail
    premium30d: number | null;     // last 30d vs retail (last price in window)
  
    return7d: number | null;       // price last / price 7d ago - 1
    return30d: number | null;
  
    vol30d: number | null;         // stdev of daily log returns (30d)
    maxDrawdown90d: number | null; // on prices in last 90d (0..1)
  
    slope30d: number | null;       // slope of ln(price) vs time (per day)
    coverage30d: number;           // 0..1
    freshnessDays: number | null;  // days since last point
  
    score: number | null;          // 0..100
  };
  
  export type WindowedSeries = {
    points: { t: number; date: Date; price: number }[]; // sorted, unique
    last: { t: number; date: Date; price: number } | null;
  };
  

  export const KNOWN_SERIES = new Set([
    "zenith supreme",
    "tempete argentee",
    "origine perdue",
    "astres radieux",
    "stars etincelantes",
    "poing de fusion",
    "celebrations",
    "evolution celeste",
    "regne de glace",
    "foudre noire",
    "rivalites destinees",
    "aventures ensemble",
    "151",
    "flammes obsidiennes",
    "destinees de paldea",
    "evolutions a paldea",
    "faille paradoxe",
    "evolutions prismatiques",
    "couronne stellaire",
    "fable nebuleuse",
    "etincelles deferlantes",
    "ecarlate et violet",
    "forces temporelles",
    "mascarade crepusculaire",
    "flamme blanche",
    "mega evolution",
    "flammes fantasmagoriques",
  ]);