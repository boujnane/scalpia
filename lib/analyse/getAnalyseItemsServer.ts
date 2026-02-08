import "server-only"

import { adminDb } from "@/lib/firebase-admin"
import type { Item } from "@/lib/analyse/types"

type AnalyseItemsCache = {
  data: Item[] | null
  timestamp: number
}

const CACHE_TTL_MS = 5 * 60 * 1000

let cache: AnalyseItemsCache = {
  data: null,
  timestamp: 0,
}

export function clearAnalyseItemsServerCache() {
  cache = { data: null, timestamp: 0 }
}

export async function getAnalyseItemsServer(options?: { forceRefresh?: boolean }) {
  const forceRefresh = options?.forceRefresh ?? false
  const now = Date.now()

  if (!forceRefresh && cache.data && now - cache.timestamp < CACHE_TTL_MS) {
    return {
      items: cache.data,
      fromCache: true,
      cacheAgeSeconds: Math.round((now - cache.timestamp) / 1000),
      cacheTTLSeconds: CACHE_TTL_MS / 1000,
    }
  }

  const db = adminDb()
  const itemsSnap = await db.collection("items").get()

  const itemPromises = itemsSnap.docs.map(async (docSnap) => {
    const data = docSnap.data() as Omit<Item, "prices">
    const pricesSnap = await db.collection("items").doc(docSnap.id).collection("prices").get()
    const prices = pricesSnap.docs.map((p) => {
      const data = p.data();
      return { date: data.date, price: data.price, sourceUrl: data.sourceUrl || null };
    })
    return { ...data, prices } as Item
  })

  const items = await Promise.all(itemPromises)

  cache = {
    data: items,
    timestamp: now,
  }

  return {
    items,
    fromCache: false,
    cacheAgeSeconds: 0,
    cacheTTLSeconds: CACHE_TTL_MS / 1000,
  }
}

