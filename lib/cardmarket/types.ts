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
    id: number
    name: string
    card_number?: string
    rarity?: string
    image?: string
    prices?: Prices
    episode: {
      name: string
      id?: number
    }
  }