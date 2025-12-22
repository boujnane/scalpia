import { NextResponse } from 'next/server'

// Cache serveur avec gestion des timestamps
const serverCache = new Map<string, { data: any; timestamp: number }>()
const SETS_CACHE_TTL = 30 * 60 * 1000 // 30 minutes (les sets changent rarement)

const PPT_API_KEY = process.env.POKEMON_PRICE_TRACKER_KEY
const BASE_URL = 'https://www.pokemonpricetracker.com/api/v2/sets'

export async function GET() {
  try {
    if (!PPT_API_KEY) {
      return NextResponse.json({ error: 'Server API key not defined' }, { status: 500 })
    }

    // Vérifier le cache
    const cached = serverCache.get('sets')
    if (cached && Date.now() - cached.timestamp < SETS_CACHE_TTL) {
      console.log('✅ Serving sets from server cache')
      return NextResponse.json(cached.data)
    }

    console.log('🌐 Fetching sets from API...')
    const res = await fetch(BASE_URL, {
      headers: {
        'Authorization': `Bearer ${PPT_API_KEY}`,
        'Accept': 'application/json',
      },
      // On peut utiliser next: { revalidate } pour le cache Next.js
      next: { revalidate: 1800 } // 30 minutes
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Failed to fetch sets', details: text }, { status: res.status })
    }

    const data = await res.json()
    
    // Mettre en cache
    serverCache.set('sets', { data: data.data, timestamp: Date.now() })
    
    return NextResponse.json(data.data)
  } catch (err: any) {
    console.error('Error fetching sets:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}