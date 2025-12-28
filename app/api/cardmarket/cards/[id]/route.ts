// app/api/cardmarket/cards/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { BASE_URL, headers } from "@/app/api/cardmarket/_utils";
import { resolveCardmarketUrl } from "@/lib/cardmarket/tcggoscrapper";

const CACHE = new Map<string, { data: any; ts: number }>();
const TTL = 30 * 60 * 1000;

function rid() {
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqId = rid();

  try {
    const { id } = await params;
    const apiKey = process.env.CARDMARKET_RAPIDAPI_KEY;

    const url = new URL(req.url);
    const scrape = url.searchParams.get("scrape") === "1";

    console.log("[card-route]", { reqId, step: "start", id, scrape });

    if (!apiKey) {
      console.log("[card-route]", { reqId, step: "missing-api-key" });
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const cacheKey = `${id}:${scrape ? "scrape" : "noscrape"}`;
    const cached = CACHE.get(cacheKey);
    if (cached && Date.now() - cached.ts < TTL) {
      console.log("[card-route]", { reqId, step: "cache-hit", cacheKey, ageMs: Date.now() - cached.ts });
      return NextResponse.json(cached.data);
    }
    console.log("[card-route]", { reqId, step: "cache-miss", cacheKey });

    // 1) Fetch card details (RapidAPI / Cardmarket API wrapper)
    const res = await fetch(`${BASE_URL}/pokemon/cards/${id}`, {
      headers: headers(apiKey),
      next: { revalidate: 1800 },
    });

    console.log("[card-route]", { reqId, step: "fetch-cm-done", status: res.status });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.log("[card-route]", { reqId, step: "fetch-cm-failed", status: res.status, text: text.slice(0, 200) });
      return NextResponse.json({ error: "Card not found" }, { status: res.status });
    }

    const json = await res.json();
    const cardData = json.data ?? {};

    // 2) champs selon versions d’API
    const directCardmarketUrl: string | null =
      cardData?.cardmarket_url ?? cardData?.cardmarketUrl ?? null;

    const tcggoUrl: string | null = cardData?.tcggo_url ?? cardData?.tcggoUrl ?? null;

    // parfois ça n'existe pas -> on le reconstruit avec l'id
    const tcggoExternalUrl: string | null =
      cardData?.links?.cardmarket ??
      (id ? `https://www.tcggo.com/external/cm/${String(id)}` : null);

    console.log("[card-route]", {
      reqId,
      step: "payload",
      hasDirectCm: !!directCardmarketUrl,
      tcggoUrl,
      tcggoExternalUrl,
    });

    // 3) résoudre uniquement si modal (scrape=1) ET pas déjà de CM url
    if (scrape && !directCardmarketUrl) {
      const resolved = await resolveCardmarketUrl({
        reqId,
        tcggoUrl,
        tcggoExternalUrl,
        cardId: id,
      });

      console.log("[card-route]", {
        reqId,
        step: "resolved",
        method: resolved.method,
        status: resolved.status,
        blocked: resolved.blocked,
        found: !!resolved.cardmarket_url,
      });

      if (resolved.cardmarket_url) {
        cardData.cardmarket_url = resolved.cardmarket_url;
      }
    }

    console.log("[card-route]", {
      reqId,
      step: "final",
      cardmarket_url: cardData?.cardmarket_url ?? null,
      tcggo_url: cardData?.tcggo_url ?? tcggoUrl ?? null,
      tcggo_external: tcggoExternalUrl ?? null,
    });

    CACHE.set(cacheKey, { data: cardData, ts: Date.now() });
    return NextResponse.json(cardData);
  } catch (err: any) {
    console.log("[card-route]", { reqId, step: "error", message: err?.message ?? String(err) });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}