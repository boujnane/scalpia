import { NextResponse } from "next/server";
import puppeteer, { Browser } from "puppeteer";
import { setTimeout as sleep } from "node:timers/promises";

export async function GET(req: Request) {
  let browser: Browser | null = null;

  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "Paramètre 'url' manquant" },
        { status: 400 }
      );
    }

    browser = await puppeteer.launch({
      headless: false, // true si tu veux pas ouvrir le navigateur
      args: ["--window-size=1400,900"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
    } catch (gotoErr) {
      throw new Error("Impossible de charger l'URL ou timeout dépassé");
    }

    await sleep(2000);

    // Accepter les cookies si présent
    try {
      const cookieBtn = await page.$("#onetrust-accept-btn-handler");
      if (cookieBtn) {
        await cookieBtn.click();
        await sleep(1000);
      }
    } catch (cookieErr) {
      console.warn("Bouton de cookies non trouvé ou clic impossible.");
    }

    const offerSelector = "div.col-sellerProductInfo.col";
    try {
      await page.waitForSelector(offerSelector, { timeout: 5000 });
    } catch {
      return NextResponse.json(
        { error: "Aucune offre trouvée sur la page" },
        { status: 404 }
      );
    }

    const offers = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("div.col-sellerProductInfo.col"));
      return rows.map((row) => {
        const priceEl = row.querySelector(
          "div.d-flex.align-items-center.justify-content-end > span.color-primary.small.text-end.text-nowrap.fw-bold"
        ) as HTMLElement | null;
        const countEl = row.querySelector("span.item-count") as HTMLElement | null;
        const sellerEl = row.querySelector(".seller-name a") as HTMLElement | null;
        const commentEl = row.querySelector(".product-comments span") as HTMLElement | null;

        return {
          price: priceEl?.innerText.trim() || null,
          count: countEl?.innerText.trim() || "1",
          seller: sellerEl?.innerText.trim() || null,
          comment: commentEl?.innerText.trim() || null,
        };
      });
    });

    console.log("Offres trouvées :", offers);

    const htmlRendered = await page.evaluate(() => document.body.innerHTML);

    return NextResponse.json({
      message: "Offres récupérées avec succès !",
      offers,
      html: htmlRendered,
    });
  } catch (err: any) {
    console.error("Erreur Puppeteer :", err);
    return NextResponse.json(
      { error: err.message || "Erreur inconnue" },
      { status: 500 }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Erreur lors de la fermeture du navigateur :", closeErr);
      }
    }
  }
}
