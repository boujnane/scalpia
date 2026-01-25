import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { setTimeout as sleep } from "node:timers/promises";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return new NextResponse('Missing query', { status: 400 });

  // URL eBay : ventes réussies
  const url = `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1`;
  console.log('URL utilisée (sold items) :', url);

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1280,800',
        '--disable-blink-features=AutomationControlled'
      ],
    });

    const page = await browser.newPage();

    // User-Agent réaliste
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.setViewport({ width: 1280, height: 800 });

    // Stealth manuel
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3] });
      Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr'] });
      // @ts-ignore
      window.chrome = { runtime: {} };
    });

    // Visite de la page
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Pause pour laisser le temps au JS d'eBay de charger le contenu
    await sleep(2000);

    const html = await page.content();
    console.log('Longueur HTML récupéré :', html.length);

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=UTF-8' },
    });

  } catch (err: any) {
    console.error(err);
    return new NextResponse(`Erreur: ${err?.message ?? err}`, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
