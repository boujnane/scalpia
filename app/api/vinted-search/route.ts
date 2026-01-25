// app/api/search/vinted/route.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { setTimeout as sleep } from 'node:timers/promises';

// Queue pour sérialiser les requêtes Puppeteer (une seule à la fois)
let queue: Promise<any> = Promise.resolve();

async function withQueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = queue.then(fn, fn); // Continue même si la précédente a échoué
  queue = result.catch(() => {}); // Évite les rejets non gérés
  return result;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return new NextResponse('Missing query', { status: 400 });

  // Utilise la queue pour éviter plusieurs Puppeteer en parallèle
  return withQueue(async () => {
    const pagesToFetch = 3;
    console.log('Vinted search:', { query: q, pages: pagesToFetch });

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
      });

      // Créer une page avec les bons paramètres
      async function createPage() {
        const page = await browser!.newPage();
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        );
        await page.setViewport({ width: 1280, height: 800 });
        // Stealth manuel simple
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => false });
          Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
          Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr'] });
          // @ts-ignore
          window.chrome = { runtime: {} };
        });
        return page;
      }

      // Fetch une page Vinted
      async function fetchPage(pageIndex: number): Promise<string> {
        const page = await createPage();
        try {
          const url = new URL('https://www.vinted.fr/catalog');
          url.searchParams.set('search_text', q!);
          url.searchParams.set('page', String(pageIndex));

          await page.goto(url.toString(), { waitUntil: 'domcontentloaded' });
          await page.waitForSelector('a.new-item-box__overlay', { timeout: 5000 }).catch(() => null);
          await sleep(300); // pause réduite
          return await page.evaluate(() => document.body.innerHTML);
        } finally {
          await page.close();
        }
      }

      // Fetch les 3 pages en parallèle
      const bodies = await Promise.all(
        Array.from({ length: pagesToFetch }, (_, i) => fetchPage(i + 1))
      );

      const html = `<!doctype html><html><body>${bodies.join("\n")}</body></html>`;
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html; charset=UTF-8' },
      });
    } catch (err: any) {
      console.error(err);
      return new NextResponse(`Erreur: ${err?.message ?? err}`, { status: 500 });
    } finally {
      if (browser) await browser.close();
    }
  });
}
