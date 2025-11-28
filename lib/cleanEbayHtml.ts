export interface EbayCleaned {
    priceFilters: { label: string | null; url: string | null }[];
    priceRangeInputs: { minLabel: string | null; maxLabel: string | null };
    histogram: { min: number; max: number; count: number }[];
  }
  
export function cleanEbayHtml(rawHtml: string): EbayCleaned {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");
  
    const priceItems = Array.from(doc.querySelectorAll('.x-refine__multi-select-link'));
    const priceFilters = priceItems.map(item => {
      const label = item.querySelector('.x-refine__multi-select-cbx')?.textContent?.trim() ?? null;
      const url = item.getAttribute('href');
      return { label, url };
    });
  
    const minInput = doc.querySelector('input[aria-label*="min"]');
    const maxInput = doc.querySelector('input[aria-label*="max"]');
  
    const bars = Array.from(doc.querySelectorAll('.price__graph__chart span'));
    const histogram = bars.map(bar => ({
      min: Number(bar.getAttribute('data-min')),
      max: Number(bar.getAttribute('data-max')),
      count: Number(bar.getAttribute('data-count')),
    }));
  
    return {
      priceFilters,
      priceRangeInputs: {
        minLabel: minInput?.getAttribute("aria-label") ?? null,
        maxLabel: maxInput?.getAttribute("aria-label") ?? null
      },
      histogram
    };
  }
  