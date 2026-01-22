// lib/insert-price.ts
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Ajoute une entrée dans la sous-collection 'prices' du document item.
 * - itemId : id du document dans la collection 'items'
 * - payload : { date: "2025-11-27", price: number | null }
 * - Si price est null, cela signifie "Prix non disponible ce jour"
 */
export async function insertPriceInDB(itemId: string, payload: { date: string; price: number | null }) {
  if (!itemId) throw new Error("itemId manquant");
  const pricesCol = collection(db, "items", itemId, "prices");
  await addDoc(pricesCol, {
    date: payload.date,
    price: payload.price,
    createdAt: new Date().toISOString(),
  });
}