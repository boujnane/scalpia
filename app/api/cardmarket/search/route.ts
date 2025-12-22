import { NextRequest, NextResponse } from 'next/server'

const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 min

const API_KEY = process.env.CARDMARKET_RAPIDAPI_KEY
const BASE_URL = 'https://cardmarket-api-tcg.p.rapidapi.com/pokemon/cards/search'

export async function GET(req: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Missing Cardmarket API key' },
        { status: 500 }
      )
    }

    const search = req.nextUrl.searchParams.get('q')

    if (!search) {
      return NextResponse.json(
        { error: 'Missing search query' },
        { status: 400 }
      )
    }

    const cacheKey = `cm:${search.toLowerCase()}`
    const cached = cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Cardmarket cache hit')
      return NextResponse.json(cached.data)
    }

    console.log('🌐 Fetch Cardmarket:', search)

    const url = `${BASE_URL}?search=${encodeURIComponent(search)}&sort=episode_newest`

    const res = await fetch(url, {
      headers: {
        'x-rapidapi-host': 'cardmarket-api-tcg.p.rapidapi.com',
        'x-rapidapi-key': API_KEY,
      },
      next: { revalidate: 600 },
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: 'Cardmarket request failed', details: text },
        { status: res.status }
      )
    }

    const data = await res.json()

    cache.set(cacheKey, { data, timestamp: Date.now() })

    return NextResponse.json(data)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
