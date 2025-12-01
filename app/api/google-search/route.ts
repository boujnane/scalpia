import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Query manquante" }, { status: 400 });
  }

  const API_KEY = process.env.GOOGLE_API_KEY;
  const CX = process.env.GOOGLE_CX;

  if (!API_KEY || !CX) {
    return NextResponse.json({ error: "Clé API ou CX manquante" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    // Renvoie maintenant à la fois le firstLink et tous les items
    return NextResponse.json({ firstLink: data.items?.[0]?.link ?? null, items: data.items ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur Google Search" }, { status: 500 });
  }
}
