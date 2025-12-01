import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Item } from "./types";

export async function fetchItems(): Promise<Item[]> {
  const querySnapshot = await getDocs(collection(db, "items"));
  const items: Item[] = [];

  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data() as Omit<Item, "prices">;
    const pricesSnap = await getDocs(
      collection(db, `items/${docSnap.id}/prices`)
    );

    const prices = pricesSnap.docs.map(p => p.data() as any);
    items.push({ ...data, prices });
  }

  return items;
}
