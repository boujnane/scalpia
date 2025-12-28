// lib/cardmarket/tcggoscrapper.ts
import * as cheerio from "cheerio";

type ResolveArgs = {
  reqId: string;
  debug?: boolean;

  // page TCGGO (html) : https://www.tcggo.com/pokemon/...
  tcggoUrl?: string | null;

  // redirect TCGGO -> Cardmarket : https://www.tcggo.com/external/cm/<id>
  tcggoExternalUrl?: string | null;

  // id carte (pour reconstruire external si absent)
  cardId?: string | number | null;
};

export type ResolveResult = {
  cardmarket_url: string | null;
  method: "already" | "external-redirect" | "external-location" | "html-scrape" | "none";
  status: number | null;
  blocked: boolean;
  attempts: number;
  finalUrl?: string | null;
  locationHeader?: string | null;
};

function log(reqId: string, debug: boolean | undefined, payload: any) {
  // log toujours les étapes "importantes", et plus de détails si debug=true
  const always = ["start", "external-done", "external-error", "html-done", "html-error", "done"];
  if (!debug && payload?.step && !always.includes(payload.step)) return;
  console.log("[tcggo-scraper]", { reqId, ...payload });
}

function short(u?: string | null, n = 120) {
  if (!u) return null;
  const s = String(u);
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function isBlockedStatus(s: number) {
  return s === 403 || s === 429;
}

function looksLikeCardmarketUrl(u?: string | null) {
  if (!u) return false;
  return u.includes("cardmarket.com");
}

async function fetchWithMeta(
  reqId: string,
  debug: boolean | undefined,
  url: string,
  opts: RequestInit
) {
  const t0 = Date.now();
  log(reqId, debug, { step: "fetch-start", url: short(url) });

  const res = await fetch(url, opts);

  // ATTENTION: sur redirect: "follow", res.url = URL finale
  const meta = {
    status: res.status,
    ok: res.ok,
    redirected: (res as any).redirected ?? undefined,
    finalUrl: short((res as any).url ?? null),
    tookMs: Date.now() - t0,
    location: short(res.headers.get("location")),
    cfRay: res.headers.get("cf-ray"),
    server: res.headers.get("server"),
    contentType: res.headers.get("content-type"),
  };

  log(reqId, debug, { step: "fetch-done", url: short(url), ...meta });

  return { res, meta };
}

/**
 * ✅ Méthode 1 (préférée): endpoint redirect TCGGO (moins fragile qu'un scrape HTML)
 * - Si redirect: "follow" => res.url devrait être Cardmarket
 * - Sinon redirect: "manual" => Location header
 */
async function tryExternalRedirect(
  reqId: string,
  debug: boolean | undefined,
  externalUrl: string
): Promise<ResolveResult> {
  // A) follow
  try {
    log(reqId, debug, { step: "external-follow-start", externalUrl: short(externalUrl) });

    const { res, meta } = await fetchWithMeta(reqId, debug, externalUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });

    // on lit très peu, juste pour éviter de bloquer
    const finalUrl = (res as any).url ?? null;

    log(reqId, debug, {
      step: "external-done",
      mode: "follow",
      status: meta.status,
      blocked: isBlockedStatus(meta.status),
      finalUrl: short(finalUrl),
      locationHeader: meta.location,
    });

    if (looksLikeCardmarketUrl(finalUrl)) {
      return {
        cardmarket_url: String(finalUrl),
        method: "external-redirect",
        status: meta.status,
        blocked: false,
        attempts: 1,
        finalUrl: String(finalUrl),
        locationHeader: meta.location ?? null,
      };
    }

    // si ça ne finit pas sur cardmarket, on tente la méthode B (manual)
  } catch (e: any) {
    log(reqId, debug, { step: "external-error", mode: "follow", message: e?.message ?? String(e) });
  }

  // B) manual
  try {
    log(reqId, debug, { step: "external-manual-start", externalUrl: short(externalUrl) });

    const { res, meta } = await fetchWithMeta(reqId, debug, externalUrl, {
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });

    const loc = res.headers.get("location");
    log(reqId, debug, {
      step: "external-done",
      mode: "manual",
      status: meta.status,
      blocked: isBlockedStatus(meta.status),
      locationHeader: short(loc),
    });

    if (looksLikeCardmarketUrl(loc)) {
      return {
        cardmarket_url: String(loc),
        method: "external-location",
        status: meta.status,
        blocked: false,
        attempts: 1,
        finalUrl: null,
        locationHeader: loc,
      };
    }
  } catch (e: any) {
    log(reqId, debug, { step: "external-error", mode: "manual", message: e?.message ?? String(e) });
  }

  return {
    cardmarket_url: null,
    method: "none",
    status: null,
    blocked: false,
    attempts: 1,
    finalUrl: null,
    locationHeader: null,
  };
}

/**
 * ✅ Méthode 2: scrape HTML de la page TCGGO (ta méthode historique)
 */
async function tryHtmlScrape(
  reqId: string,
  debug: boolean | undefined,
  tcggoUrl: string
): Promise<ResolveResult> {
  try {
    log(reqId, debug, { step: "html-start", tcggoUrl: short(tcggoUrl) });

    const { res, meta } = await fetchWithMeta(reqId, debug, tcggoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PokeBot/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    const html = await res.text();
    log(reqId, debug, {
      step: "html-size",
      status: meta.status,
      bytes: html.length,
      snippet: debug ? html.slice(0, 200) : undefined,
    });

    const $ = cheerio.load(html);
    const cmLink = $('a[href*="cardmarket.com"]').attr("href") || null;

    log(reqId, debug, {
      step: "html-done",
      status: meta.status,
      blocked: isBlockedStatus(meta.status),
      found: !!cmLink,
      cmLink: short(cmLink),
    });

    return {
      cardmarket_url: cmLink,
      method: "html-scrape",
      status: meta.status,
      blocked: isBlockedStatus(meta.status),
      attempts: 1,
      finalUrl: meta.finalUrl ?? null,
      locationHeader: meta.location ?? null,
    };
  } catch (e: any) {
    log(reqId, debug, { step: "html-error", message: e?.message ?? String(e) });
    return {
      cardmarket_url: null,
      method: "none",
      status: null,
      blocked: false,
      attempts: 1,
      finalUrl: null,
      locationHeader: null,
    };
  }
}

export async function resolveCardmarketUrl(args: ResolveArgs): Promise<ResolveResult> {
  const { reqId, debug, tcggoUrl, tcggoExternalUrl, cardId } = args;

  const external =
    tcggoExternalUrl ||
    (cardId ? `https://www.tcggo.com/external/cm/${String(cardId)}` : null);

  log(reqId, debug, {
    step: "start",
    tcggoUrl: short(tcggoUrl),
    tcggoExternalUrl: short(tcggoExternalUrl),
    externalComputed: short(external),
    cardId,
  });

  // 1) d’abord essayer l’external redirect (si dispo)
  if (external) {
    const r = await tryExternalRedirect(reqId, debug, external);
    if (r.cardmarket_url) {
      log(reqId, debug, { step: "done", method: r.method, cardmarket_url: short(r.cardmarket_url) });
      return r;
    }
  }

  // 2) fallback: html scrape (si tcggoUrl dispo)
  if (tcggoUrl) {
    const r = await tryHtmlScrape(reqId, debug, tcggoUrl);
    if (r.cardmarket_url) {
      log(reqId, debug, { step: "done", method: r.method, cardmarket_url: short(r.cardmarket_url) });
      return r;
    }
  }

  log(reqId, debug, { step: "done", method: "none", found: false });
  return {
    cardmarket_url: null,
    method: "none",
    status: null,
    blocked: false,
    attempts: 0,
    finalUrl: null,
    locationHeader: null,
  };
}