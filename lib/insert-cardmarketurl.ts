import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function insertCardmarketUrlInDB(itemId: string, url: string) {
  const ref = doc(db, "items", itemId);
  await updateDoc(ref, { cardmarketUrl: url });
}
