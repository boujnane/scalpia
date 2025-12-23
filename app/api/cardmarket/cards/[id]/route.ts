import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, headers } from '@/app/api/cardmarket/_utils'
import * as cheerio from 'cheerio'

const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 30 * 60 * 1000 // 30 min

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const apiKey = process.env.CARDMARKET_RAPIDAPI_KEY

    // 1. Check Cache
    const cached = CACHE.get(id)
    if (cached && Date.now() - cached.ts < TTL) {
      return NextResponse.json(cached.data)
    }

    // 2. Fetch Card Data from API
    const res = await fetch(`${BASE_URL}/pokemon/cards/${id}`, {
      headers: headers(apiKey!),
      next: { revalidate: 1800 },
    })

    if (!res.ok) return NextResponse.json({ error: 'Card not found' }, { status: res.status })

    const json = await res.json()
    const cardData = json.data

    // 3. Scraping "gentil" de l'URL Cardmarket
    if (cardData.tcggo_url) {
      try {
        // On récupère le HTML de la page TCGGO
        const htmlRes = await fetch(cardData.tcggo_url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PokeBot/1.0)' },
          signal: AbortSignal.timeout(5000) // Timeout de 5s pour ne pas bloquer l'API
        })
        
        const html = await htmlRes.text()
        const $ = cheerio.load(html)
        
        // On cherche le lien qui pointe vers Cardmarket
        // Souvent dans des boutons ou liens avec la classe ou l'href contenant 'cardmarket'
        const cmLink = $('a[href*="cardmarket.com"]').attr('href')
        
        if (cmLink) {
          // On ajoute le lien direct à l'objet cardData
          cardData.cardmarket_url = cmLink
        }
      } catch (scrapeErr) {
        console.error(`Scraping failed for card ${id}:`, scrapeErr)
        // On ne bloque pas la réponse si le scraping échoue, on continue sans le lien CM
      }
    }

    // 4. Save to Cache & Return
    CACHE.set(id, { data: cardData, ts: Date.now() })
    return NextResponse.json(cardData)

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}