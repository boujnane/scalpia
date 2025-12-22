// lib/cardmarket/mapCard.ts
export const mapCMCard = (card: any) => ({
    id: card.id,
    name: card.name,
    card_number: card.card_number,
    rarity: card.rarity,
    image: card.image,
  
    episode: {
      name: card.episode.name,
      slug: card.episode.slug,
      released_at: card.episode.released_at,
      logo: card.episode.logo,
    },
  
    series: {
      name: card.series?.name,
      slug: card.series?.slug,
    },
  
    prices: {
      fr:
        card.prices?.cardmarket?.lowest_near_mint_FR ??
        card.prices?.cardmarket?.lowest_near_mint ??
        card.prices?.cardmarket?.['30d_average'] ??
        null,
      avg7: card.prices?.cardmarket?.['7d_average'] ?? null,
      avg30: card.prices?.cardmarket?.['30d_average'] ?? null,
      graded: card.prices?.cardmarket?.graded ?? null,
    },
  })
  