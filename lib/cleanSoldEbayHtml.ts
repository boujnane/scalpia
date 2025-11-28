export interface CleanSoldItem {
    title: string;
    url?: string;
    img?: string | null;
    price: string;
    soldDate?: string | null;
    condition?: string | null;
    shipping?: string | null;
    seller?: string | null;
  }
  
  export function cleanSoldEbayHtml(rawHtml: string): CleanSoldItem[] {
    if (!rawHtml) return [];
  
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");
  
    const items = Array.from(doc.querySelectorAll("li.s-card"));
    console.log("Nombre total de li.s-card trouvés :", items.length);
  
    const mappedItems = items.map((item, index) => {
      // Récupération du lien
      const linkEl = item.querySelector("a.s-card__link");
      const url = linkEl?.getAttribute("href") ?? undefined;
  
      // Récupération du titre dans le span correct
      const titleEl = item.querySelector("div.s-card__title span.su-styled-text.primary.default");
      const title = titleEl?.textContent?.trim() ?? "Titre inconnu"; // fallback si titre manquant
  
      // Image
      const img = item.querySelector("img.s-card__image")?.getAttribute("src") ?? null;
  
      // Prix
      const price = item.querySelector(
        "span.su-styled-text.positive.bold.large-1.s-card__price, span.su-styled-text.positive.italic.large-1.s-card__price"
      )?.textContent?.trim() ?? "Prix inconnu";
  
      // Date de vente
      const soldDate = item.querySelector("span.su-styled-text.positive.default")?.textContent?.replace("Vendu le", "").trim() ?? null;
  
      // Condition
      const conditionSpans = item.querySelectorAll("div.s-card__subtitle span.su-styled-text.secondary.default");
      const condition = Array.from(conditionSpans).map(s => s.textContent?.trim() ?? "").join(" ").trim() || null;
  
      // Livraison
      const shippingEl = Array.from(item.querySelectorAll("div.s-card__attribute-row span.su-styled-text.secondary.large"))
        .find(s => /Livraison/i.test(s.textContent ?? ""));
      const shipping = shippingEl?.textContent?.trim() ?? null;
  
      // Vendeur
      const seller = item.querySelector(".su-card-container__attributes__secondary span.su-styled-text.primary.large")?.textContent?.trim() ?? null;
  
      console.log(`Item #${index} extrait :`, { title, url, img, price, soldDate, condition, shipping, seller });
  
      return { title, url, img, price, soldDate, condition, shipping, seller };
    });
  
    console.log("Nombre d'items après extraction :", mappedItems.length);
    return mappedItems.slice(2, 14);
  }
  