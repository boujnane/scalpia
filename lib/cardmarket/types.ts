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
  
  export interface CMCard {
    id: number
    name: string
    card_number?: string
    rarity?: string
    image?: string
    prices?: {
      fr?: number
      avg7?: number
      graded?: {
        psa?: Record<string, number>
        bgs?: Record<string, number>
        cgc?: Record<string, number>
      }
    }
    episode: {
      name: string
      id?: number
    }
  }