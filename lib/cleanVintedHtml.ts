export interface VintedCleaned {
    items: {
      id: number;
      title: string;
      price: number;
      currency: string;
      url: string;
      thumbnail: string | null;
    }[];
    filters: Record<string, any>; // brut
    rawHtml: string; // pour debug
  }
  
  export function cleanVintedHtml(rawHtml: string): VintedCleaned {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");
  
    const itemLinks = Array.from(
      doc.querySelectorAll('a.new-item-box__overlay')
    ).slice(0, 30);
  
    const items = itemLinks.map(link => {
      const titleAttr = link.getAttribute('title') || '';
      const url = link.getAttribute('href') || '';
      const idMatch = url.match(/\/items\/(\d+)-/);
      const id = idMatch ? parseInt(idMatch[1]) : Math.floor(Math.random() * 1000000);
    
      // --- Nouveau : prix vert (protection acheteur) ---
      const priceMatches = [...titleAttr.matchAll(/([\d,.]+)\s*€/g)];
      let price = 0;
      if (priceMatches.length > 1) {
        price = parseFloat(priceMatches[1][1].replace(',', '.'));
      } else if (priceMatches.length === 1) {
        price = parseFloat(priceMatches[0][1].replace(',', '.'));
      }
    
      // Cherche un <img> dans le parent de la carte
      const parent = link.closest('.new-item-box__wrapper') || link.parentElement;
      const img = parent?.querySelector('img');
      const thumbnail =
        img?.getAttribute('src') ||
        img?.getAttribute('data-src') ||
        img?.getAttribute('data-srcset')?.split(' ')[0] ||
        null;
    
      return { id, title: titleAttr, price, currency: 'EUR', url, thumbnail };
    });
    
  
    return {
      items,
      filters: {},
      rawHtml
    };
  }
  