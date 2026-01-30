import { NextResponse } from "next/server";
import { chromium, Browser } from "playwright";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let browser: Browser | null = null;

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "etb aventures"; 
    const searchURL = `https://www.leboncoin.fr/recherche?text=${encodeURIComponent(query)}`;

    browser = await chromium.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });

    const context = await browser.newContext({
      viewport: { width: 1400, height: 900 },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();
    await page.goto(searchURL, { waitUntil: "domcontentloaded", timeout: 60000 });

    const offerCardSelector = 'article[data-test-id="ad"]';

    // Attendre soit les résultats, soit le message "pas de résultats"
    const result = await Promise.race([
      page.waitForSelector(offerCardSelector, { timeout: 30000 }).then(() => 'results'),
      page.waitForSelector('p:has-text("nous n\'avons pas")', { timeout: 30000 }).then(() => 'no-results'),
    ]).catch(() => 'timeout');

    // Si pas de résultats, retourner liste vide
    if (result === 'no-results' || result === 'timeout') {
      return NextResponse.json({
        message: `Recherche "${query}" effectuée - aucun résultat.`,
        offers: [],
      });
    }

    const offers = await page.$$eval(offerCardSelector, (cards) =>
      cards.slice(0, 30).map((card) => {
        const titleEl = card.querySelector('p[data-test-id="adcard-title"]');
        const priceEl = card.querySelector('p[data-test-id="price"] span'); 
        const srOnlyElements = card.querySelectorAll('.sr-only');

        let category = 'Catégorie inconnue';
        let location = 'Lieu inconnu';
        if (srOnlyElements.length >= 2) {
          category = srOnlyElements[0].textContent?.replace('Catégorie : ', '').replace('.', '').trim() || category;
          location = srOnlyElements[1].textContent?.replace('Située à ', '').replace('.', '').trim() || location;
        }

        const linkEl = card.querySelector('a[aria-label="Voir l’annonce"]');
        let relativeLink = linkEl?.getAttribute('href') || null;

        // --- Récupération de l'image principale ---
        const imgEl = card.querySelector('img');
        const image = imgEl?.getAttribute('src') || null;

        return {
          title: titleEl?.textContent?.trim() || 'Titre inconnu',
          price: priceEl?.textContent?.trim() || 'Prix inconnu',
          location,
          category,
          link: relativeLink ? `https://www.leboncoin.fr${relativeLink}` : null,
          image,
        };
      })
    );

    return NextResponse.json({
      message: `Recherche "${query}" effectuée.`,
      offers,
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur inconnue" }, { status: 500 });
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}
