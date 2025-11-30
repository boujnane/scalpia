import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { setTimeout as sleep } from 'node:timers/promises';
import * as cheerio from 'cheerio'; // ← correction ici

export interface EbayCleaned {
  priceFilters: { label: string | null; url: string | null }[];
  priceRangeInputs: { minLabel: string | null; maxLabel: string | null };
  histogram: { min: number; max: number; count: number }[];
}

export function cleanEbayHtml(rawHtml: string): EbayCleaned {
  const $ = cheerio.load(rawHtml);

  const priceFilters = $('.x-refine__multi-select-link')
    .map((_, el) => ({
      label: $(el).find('.x-refine__multi-select-cbx').text().trim() || null,
      url: $(el).attr('href') || null
    }))
    .get();

  const minLabel = $('input[aria-label*="min"]').attr('aria-label') || null;
  const maxLabel = $('input[aria-label*="max"]').attr('aria-label') || null;

  const histogram = $('.price__graph__chart span')
    .map((_, el) => ({
      min: Number($(el).attr('data-min')),
      max: Number($(el).attr('data-max')),
      count: Number($(el).attr('data-count')),
    }))
    .get();

  return {
    priceFilters,
    priceRangeInputs: { minLabel, maxLabel },
    histogram,
  };
}

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

    // Stealth simple
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
    const cleaned = cleanEbayHtml(html);

    return NextResponse.json(cleaned);
  } catch (err: any) {
    console.error(err);
    return new NextResponse(`Erreur: ${err?.message ?? err}`, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
