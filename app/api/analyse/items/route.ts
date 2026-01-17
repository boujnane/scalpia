// app/api/analyse/items/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { Item } from "@/lib/analyse/types";

export const runtime = "nodejs";

// Cache en mémoire côté serveur
let cache: {
  data: Item[] | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

// TTL du cache: 5 minutes (300 000 ms)
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();

    // Vérifier si le cache est valide
    if (cache.data && now - cache.timestamp < CACHE_TTL) {
      return NextResponse.json({
        items: cache.data,
        fromCache: true,
        cacheAge: Math.round((now - cache.timestamp) / 1000),
        cacheTTL: CACHE_TTL / 1000,
      });
    }

    // Récupérer tous les items
    const db = adminDb();
    const itemsSnap = await db.collection("items").get();

    const items: Item[] = [];

    // Pour chaque item, récupérer ses prices
    // Utiliser Promise.all pour paralléliser
    const itemPromises = itemsSnap.docs.map(async (docSnap) => {
      const data = docSnap.data() as Omit<Item, "prices">;
      const pricesSnap = await db
        .collection("items")
        .doc(docSnap.id)
        .collection("prices")
        .get();

      const prices = pricesSnap.docs.map((p) => p.data() as { date: string; price: number });

      return { ...data, prices } as Item;
    });

    const fetchedItems = await Promise.all(itemPromises);
    items.push(...fetchedItems);

    // Mettre à jour le cache
    cache = {
      data: items,
      timestamp: now,
    };

    return NextResponse.json({
      items,
      fromCache: false,
      cacheAge: 0,
      cacheTTL: CACHE_TTL / 1000,
    });
  } catch (error) {
    console.error("[API Analyse Items] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}

// Endpoint pour forcer le refresh du cache (admin only, optionnel)
export async function POST() {
  cache = { data: null, timestamp: 0 };
  return NextResponse.json({ success: true, message: "Cache cleared" });
}
