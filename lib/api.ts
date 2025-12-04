// file: lib/api.ts

const handleRes = async (res: Response) => {
if (!res.ok) {
const txt = await res.text();
throw new Error(txt || res.statusText);
}
return res;
};


export const fetchEbaySearch = async (q: string, signal?: AbortSignal) => {
const res = await fetch(`/api/ebay-search?q=${encodeURIComponent(q)}`, { signal });
await handleRes(res);
return res.text();
};


export const fetchEbaySold = async (q: string, signal?: AbortSignal) => {
const res = await fetch(`/api/ebay-sold?q=${encodeURIComponent(q)}`, { signal });
await handleRes(res);
return res.text();
};


export const postEbayFilter = async (query: string, items: any[], signal?: AbortSignal) => {
const res = await fetch('/api/ebay-filter', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ query, items }),
signal,
});
await handleRes(res);
return res.json();
};


export const fetchVintedSearch = async (q: string, signal?: AbortSignal) => {
const res = await fetch(`/api/vinted-search?q=${encodeURIComponent(q)}`, { signal });
await handleRes(res);
return res.text();
};

export const postVintedFilter = async (query: string, items: any[], signal?: AbortSignal) => {
  const res = await fetch('/api/vinted-filter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, items }),
    signal,
  });
  await handleRes(res);
  return res.json();
};
