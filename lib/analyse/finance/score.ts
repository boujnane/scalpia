// Score 0..100 basé sur Return/Trend/Risk/Data-quality

function clamp01(x: number): number {
    return Math.max(0, Math.min(1, x));
  }
  
  function clamp(x: number, a: number, b: number): number {
    return Math.max(a, Math.min(b, x));
  }
  
  export function scoreComposite(params: {
    premium30d: number | null;     // -1..+inf
    slope30d: number | null;       // small number
    vol30d: number | null;         // log-return stdev
    maxDrawdown90d: number | null; // 0..1
    coverage30d: number;           // 0..1
    freshnessDays: number | null;  // 0..inf
  }): number | null {
    const { premium30d, slope30d, vol30d, maxDrawdown90d, coverage30d, freshnessDays } = params;
  
    // If no price info => no score
    if (premium30d == null && slope30d == null) return null;
  
    // 1) Return vs retail: map -50%..+150% -> 0..1 (cap)
    const R = premium30d == null ? 0.5 : clamp01((premium30d + 0.5) / 2.0);
  
    // 2) Trend: slope log-price per day. Typical range small (e.g. -0.01..+0.01)
    const T = slope30d == null ? 0.5 : clamp01((slope30d + 0.01) / 0.02);
  
    // 3) Risk: combine vol + drawdown (lower is better)
    const vol = vol30d == null ? 0.03 : vol30d; // fallback
    const dd = maxDrawdown90d == null ? 0.15 : maxDrawdown90d;
  
    // map vol 0..0.08 -> 1..0
    const volScore = 1 - clamp01(vol / 0.08);
    // map dd 0..0.5 -> 1..0
    const ddScore = 1 - clamp01(dd / 0.5);
    const K = 0.55 * volScore + 0.45 * ddScore;
  
    // 4) Data Quality
    const cov = clamp01(coverage30d);
    const fresh = freshnessDays == null ? 0 : freshnessDays;
    // freshness: 0 days => 1, 14 days => ~0
    const freshScore = clamp01(1 - fresh / 14);
    const Q = 0.65 * cov + 0.35 * freshScore;
  
    // weights
    const score01 = 0.40 * R + 0.25 * T + 0.20 * K + 0.15 * Q;
    return Math.round(clamp(score01 * 100, 0, 100));
  }
  