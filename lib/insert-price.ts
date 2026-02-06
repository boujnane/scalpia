// lib/insert-price.ts
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Ajoute une entrée dans la sous-collection 'prices' du document item.
 * - itemId : id du document dans la collection 'items'
 * - payload : { date: "2025-11-27", price: number | null, sourceUrl?: string }
 * - Si price est null, cela signifie "Prix non disponible ce jour"
 * - sourceUrl : lien vers l'annonce source du prix (Vinted, LBC, eBay, Cardmarket)
 */
export async function insertPriceInDB(
  itemId: string,
  payload: { date: string; price: number | null; sourceUrl?: string | null }
) {
  if (!itemId) throw new Error("itemId manquant");
  const pricesCol = collection(db, "items", itemId, "prices");

  const data: Record<string, unknown> = {
    date: payload.date,
    price: payload.price,
    createdAt: new Date().toISOString(),
  };

  // Ajouter sourceUrl seulement si présent
  if (payload.sourceUrl) {
    data.sourceUrl = payload.sourceUrl;
  }

  await addDoc(pricesCol, data);
}