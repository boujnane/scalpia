import { NextResponse } from 'next/server'
import { BASE_URL, headers } from '../_utils'

const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 60 * 60 * 1000 // 1h

export async function GET() {
  try {
    const apiKey = process.env.CARDMARKET_RAPIDAPI_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 })
    }

    const cacheKey = 'all_sets'
    const cached = CACHE.get(cacheKey)
    if (cached && Date.now() - cached.ts < TTL) {
      return NextResponse.json(cached.data)
    }

    let allSets: any[] = []
    let currentPage = 1
    let totalPages = 1

    console.log('🚀 Starting full sets fetch...')

    // Boucle tant qu'on n'a pas atteint la dernière page
    while (currentPage <= totalPages) {
      const res = await fetch(`${BASE_URL}/pokemon/episodes?page=${currentPage}`, {
        headers: headers(apiKey),
        next: { revalidate: 3600 },
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error(`❌ Page ${currentPage} error:`, res.status, errorText)
        break // Arrêt si erreur sur une page
      }

      const json = await res.json()

      // Mise à jour du total de pages à la première itération
      if (currentPage === 1) {
        totalPages = json.paging?.total || 1
      }

      // Normalisation et accumulation
      const normalized = json.data.map((ep: any) => ({
        id: ep.id,
        name: ep.name,
        slug: ep.slug,
        logo: ep.logo,
        released_at: ep.released_at,
        series: { name: ep.series?.name ?? 'Autres' },
        game: ep.game?.slug,
      }))

      allSets = [...allSets, ...normalized]
      console.log(`✅ Loaded page ${currentPage}/${totalPages} (${allSets.length} sets total)`)
      
      currentPage++
    }

    // On trie éventuellement par date de sortie (plus récent en premier)
    allSets.sort((a, b) => new Date(b.released_at).getTime() - new Date(a.released_at).getTime())

    CACHE.set(cacheKey, { data: allSets, ts: Date.now() })
    return NextResponse.json(allSets)

  } catch (err: any) {
    console.error('❌ Unexpected error during multi-page fetch:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}