import { NextResponse } from "next/server";
import { BASE_URL, headers } from "@/app/api/cardmarket/_utils";

export const runtime = "nodejs";

const CACHE = new Map<string, { data: any; ts: number }>();
const TTL = 60 * 60 * 1000; // 1h

function rid() {
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}

export async function GET(req: Request) {
  const reqId = rid();
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "1";

  const cacheKey = "sets:available:v2";
  const cached = CACHE.get(cacheKey);
  if (!force && cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json(cached.data);
  }

  const apiKey = process.env.CARDMARKET_RAPIDAPI_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing API key" }, { status: 500 });
  const API_KEY: string = apiKey;

  // 1) Fetch ALL sets (multi-pages) ✅ (copie ta logique qui marche)
  let allSets: any[] = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const res = await fetch(`${BASE_URL}/pokemon/episodes?page=${currentPage}`, {
      headers: headers(API_KEY),
      next: { revalidate: 3600 },
      // optionnel: timeout sécurité
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.error("[sets-available]", { reqId, step: "episodes-page-error", page: currentPage, status: res.status, errorText: errorText.slice(0, 200) });
      break;
    }

    const json = await res.json();

    if (currentPage === 1) {
      totalPages = json.paging?.total || 1;
    }

    const normalized = (json.data || []).map((ep: any) => ({
      id: ep.id,
      name: ep.name,
      slug: ep.slug,
      logo: ep.logo,
      released_at: ep.released_at,
      series: { name: ep.series?.name ?? "Autres" },
      game: ep.game?.slug,
    }));

    allSets = [...allSets, ...normalized];
    currentPage++;
  }

  // tri comme toi (récent -> ancien)
  allSets.sort((a, b) => new Date(b.released_at).getTime() - new Date(a.released_at).getTime());

  // 2) Scan cards page 1 pour détecter les sets vides
  const CONCURRENCY = 10;

  async function hasCards(setId: number) {
    try {
      const cardsUrl = `${BASE_URL}/pokemon/episodes/${setId}/cards?sort=price_highest&page=1`;
      const r = await fetch(cardsUrl, {
        headers: headers(API_KEY),
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(15000),
      });
      if (!r.ok) return { ok: false, count: 0 };

      const j = await r.json().catch(() => null);
      const count = Array.isArray(j?.data) ? j.data.length : 0;
      return { ok: true, count };
    } catch {
      return { ok: false, count: 0 };
    }
  }

  const available: any[] = [];
  for (let i = 0; i < allSets.length; i += CONCURRENCY) {
    const chunk = allSets.slice(i, i + CONCURRENCY);

    const checks = await Promise.all(
      chunk.map(async (s: any) => {
        const r = await hasCards(Number(s.id));
        return { s, ...r };
      })
    );

    checks.forEach(({ s, ok, count }) => {
      if (ok && count > 0) available.push(s);
    });

  }

  const payload = {
    data: available,
    stats: { before: allSets.length, after: available.length },
  };

  CACHE.set(cacheKey, { data: payload, ts: Date.now() });
  return NextResponse.json(payload);
}