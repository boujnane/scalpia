import { NextResponse } from "next/server";
import { firefox, Browser } from "playwright";

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

    // Lancement du navigateur Firefox
    browser = await firefox.launch({
      headless: false, // true si tu veux pas ouvrir le navigateur
    });

    // Création du contexte avec viewport fixe
    const context = await browser.newContext({
      viewport: { width: 1400, height: 900 },
    });

    const page = await context.newPage();

    // Aller sur l'URL
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    } catch (gotoErr) {
      throw new Error("Impossible de charger l'URL ou timeout dépassé");
    }

    // Petit délai pour laisser les scripts se charger
    await page.waitForTimeout(2000);

    // Accepter les cookies si présent
    try {
      const cookieBtn = await page.$("#onetrust-accept-btn-handler");
      if (cookieBtn) {
        await cookieBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch {
      console.warn("Bouton de cookies non trouvé ou clic impossible.");
    }

    // Sélecteur des offres
    const offerSelector = "div.col-sellerProductInfo.col";
    try {
      await page.waitForSelector(offerSelector, { timeout: 5000 });
    } catch {
      return NextResponse.json(
        { error: "Aucune offre trouvée sur la page" },
        { status: 404 }
      );
    }

    // Extraction des offres
    const offers = await page.$$eval(offerSelector, (rows) =>
      rows.map((row) => {
        const priceEl = row.querySelector(
          "div.d-flex.align-items-center.justify-content-end > span.color-primary.small.text-end.text-nowrap.fw-bold"
        );
        const countEl = row.querySelector("span.item-count");
        const sellerEl = row.querySelector(".seller-name a");
        const commentEl = row.querySelector(".product-comments span");

        return {
          price: priceEl?.textContent?.trim() || null,
          count: countEl?.textContent?.trim() || "1",
          seller: sellerEl?.textContent?.trim() || null,
          comment: commentEl?.textContent?.trim() || null,
        };
      })
    );

    console.log("Offres trouvées :", offers);

    // HTML rendu complet
    const htmlRendered = await page.content();

    return NextResponse.json({
      message: "Offres récupérées avec succès !",
      offers,
      html: htmlRendered,
    });
  } catch (err: any) {
    console.error("Erreur Playwright :", err);
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
