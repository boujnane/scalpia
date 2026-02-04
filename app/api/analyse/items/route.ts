// app/api/analyse/items/route.ts
import { NextResponse } from "next/server";
import { clearAnalyseItemsServerCache, getAnalyseItemsServer } from "@/lib/analyse/getAnalyseItemsServer";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { items, fromCache, cacheAgeSeconds, cacheTTLSeconds } = await getAnalyseItemsServer()

    return NextResponse.json({
      items,
      fromCache,
      cacheAge: cacheAgeSeconds,
      cacheTTL: cacheTTLSeconds,
    })
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
  clearAnalyseItemsServerCache()
  return NextResponse.json({ success: true, message: "Cache cleared" })
}
