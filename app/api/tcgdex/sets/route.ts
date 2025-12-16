// app/api/tcgdex/sets/route.ts
import { NextResponse } from 'next/server'
import TCGdex from '@tcgdex/sdk'

export async function GET() {
  try {
    const tcgdex = new TCGdex('fr')
    const sets = await tcgdex.fetch('sets') // récupère tous les sets
    return NextResponse.json(sets)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erreur TCGdex' }, { status: 500 })
  }
}
