import { NextResponse } from 'next/server'

const cardsCache = new Map<string, { data: any; timestamp: number }>()
const CARDS_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

const PPT_API_KEY = process.env.POKEMON_PRICE_TRACKER_KEY
const BASE_URL = 'https://www.pokemonpricetracker.com/api/v2/cards'

export async function GET(req: Request) {
  try {
    if (!PPT_API_KEY) {
      return NextResponse.json({ error: 'Server API key not defined' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const setId = searchParams.get('setId')

    if (!setId) {
      return NextResponse.json({ error: 'Missing setId' }, { status: 400 })
    }

    // Vérifier le cache
    const cacheKey = `cards:${setId}`
    const cached = cardsCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CARDS_CACHE_TTL) {
      console.log(`✅ Serving cards for ${setId} from server cache`)
      return NextResponse.json(cached.data)
    }

    console.log(`🌐 Fetching cards for ${setId} from API...`)
    const res = await fetch(`${BASE_URL}?set=${setId}&fetchAllInSet=true`, {
      headers: {
        'Authorization': `Bearer ${PPT_API_KEY}`,
        'Accept': 'application/json',
      },
      next: { revalidate: 600 } // 10 minutes
    })

    const text = await res.text()
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch cards', details: text }, { status: res.status })
    }

    const data = JSON.parse(text)
    
    // Mettre en cache
    cardsCache.set(cacheKey, { data: data.data, timestamp: Date.now() })
    
    return NextResponse.json(data.data)
  } catch (err: any) {
    console.error('Error fetching cards:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
