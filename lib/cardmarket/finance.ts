export type CMCardLike = {
    id: number;
    name: string;
    card_number?: string;
    rarity?: string;
    image?: string;
    prices?: { fr?: number; avg7?: number };
  };
  
  export type SetFinanceMetrics = {
    totalValue: number;          // somme des prix retenus
    totalCardsPriced: number;    // nb cartes avec un prix exploitable
    coverage: number;            // totalCardsPriced / totalCards
    topCards: Array<{
      id: number;
      name: string;
      card_number?: string;
      rarity?: string;
      image?: string;
      price: number;
    }>;
  };
  
  /**
   * Choix de "price" par carte :
   * - on privilégie fr (meilleur prix FR) car c'est ton use-case achat/valeur marché rapide
   * - fallback avg7 si fr absent
   */
  export function pickBestPrice(card: CMCardLike): number | null {
    const fr = card.prices?.fr;
    const avg7 = card.prices?.avg7;
    if (typeof fr === "number" && Number.isFinite(fr) && fr > 0) return fr;
    if (typeof avg7 === "number" && Number.isFinite(avg7) && avg7 > 0) return avg7;
    return null;
  }
  
  /**
   * Calcule la valeur du set (hors reverse) à partir de allCards:
   * IMPORTANT:
   * - ton API semble déjà renvoyer un objet carte unique (pas les reverse séparées)
   * - donc "hors reverse" = on ne compte qu’une occurrence par numéro/carte
   * - mais si un jour l'API te renvoie des doubles (reverse/non-reverse), tu peux déduper ici.
   */
  export function computeSetFinanceMetrics(cards: CMCardLike[], topN = 10): SetFinanceMetrics {
    const totalCards = cards.length;
  
    // Déduplication préventive par id (safe)
    const uniqueMap = new Map<number, CMCardLike>();
    for (const c of cards) uniqueMap.set(c.id, c);
    const unique = [...uniqueMap.values()];
  
    const priced = unique
      .map((c) => {
        const price = pickBestPrice(c);
        return price == null ? null : { c, price };
      })
      .filter(Boolean) as Array<{ c: CMCardLike; price: number }>;
  
    const totalValue = priced.reduce((acc, x) => acc + x.price, 0);
    const topCards = priced
      .sort((a, b) => b.price - a.price)
      .slice(0, topN)
      .map(({ c, price }) => ({
        id: c.id,
        name: c.name,
        card_number: c.card_number,
        rarity: c.rarity,
        image: c.image,
        price,
      }));
  
    const totalCardsPriced = priced.length;
    const coverage = totalCards > 0 ? totalCardsPriced / totalCards : 0;
  
    return {
      totalValue,
      totalCardsPriced,
      coverage,
      topCards,
    };
  }
  
  export function formatEUR(value: number): string {
    // simple & stable; si tu veux i18n avancé, on passe par Intl.NumberFormat("fr-FR", { style:"currency", currency:"EUR" })
    return `${value.toFixed(2)} €`;
  }
  
  export function formatPercent01(x: number): string {
    const v = Math.max(0, Math.min(1, x));
    return `${(v * 100).toFixed(0)}%`;
  }
  