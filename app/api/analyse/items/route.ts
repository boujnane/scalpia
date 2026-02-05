// app/api/analyse/items/route.ts
import { NextRequest, NextResponse } from "next/server";
import { clearAnalyseItemsServerCache, getAnalyseItemsServer } from "@/lib/analyse/getAnalyseItemsServer";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";

    if (forceRefresh) {
      clearAnalyseItemsServerCache();
    }

    const { items, fromCache, cacheAgeSeconds, cacheTTLSeconds } = await getAnalyseItemsServer({
      forceRefresh,
    });

    return NextResponse.json({
      items,
      fromCache,
      cacheAge: cacheAgeSeconds,
      cacheTTL: cacheTTLSeconds,
      forcedRefresh: forceRefresh,
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
  clearAnalyseItemsServerCache()
  return NextResponse.json({ success: true, message: "Cache cleared" })
}
