// app/api/search/ebay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { setTimeout as sleep } from 'node:timers/promises';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  if (!q) return new NextResponse('Missing query', { status: 400 });

  const url = `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(q)}&_sop=13`;
  console.log('URL utilisée :', url);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    });

    const page = await browser.newPage();
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

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await sleep(2000);

    const html = await page.content();
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=UTF-8' } });
  } catch (err: any) {
    console.error(err);
    return new NextResponse(`Erreur: ${err?.message ?? err}`, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
