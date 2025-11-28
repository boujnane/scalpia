// seed.ts
import { collection, doc, getDocs, setDoc, updateDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";

// Mapping des types vers leur prix retail
const RETAIL_PRICES: Record<string, number> = {
  "ETB": 55.99,
  "Display": 215.64,
  "Demi-Display": 107.82,
  "Tri-Pack": 17.99,
  "Bundle": 35,
  "UPC": 160,
  "Blister": 5.99,
};

// Les types supplémentaires à générer
const ADDITIONAL_TYPES = ["Display", "Tri-Pack", "Demi-Display", "Bundle", "UPC", "Blister"];

async function addRetailPriceToExistingItems() {
  const itemsCol = collection(db, "items");
  const snapshot = await getDocs(itemsCol);

  console.log(`⚡ ${snapshot.size} items trouvés dans la collection`);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const itemType = data.type;

    if (!itemType) {
      console.warn(`⚠️ Item ${data.name} n'a pas de type défini`);
      continue;
    }

    const retailPrice = RETAIL_PRICES[itemType] ?? 0;
    await updateDoc(doc(db, "items", docSnap.id), { retailPrice });
    console.log(`✅ ${data.name} (${itemType}) mis à jour avec retailPrice: ${retailPrice}€`);
  }

  console.log("🎉 Ajout des retailPrice terminé !");
}

async function generateAdditionalTypes() {
  const itemsCol = collection(db, "items");
  const snapshot = await getDocs(itemsCol);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    for (const newType of ADDITIONAL_TYPES) {
      // Vérifier si cet item avec ce type existe déjà
      const q = query(itemsCol, where("name", "==", data.name), where("type", "==", newType));
      const existing = await getDocs(q);

      if (!existing.empty) continue; // existe déjà, on skip

      // Créer le nouvel item
      const newDocRef = doc(itemsCol);
      await setDoc(newDocRef, {
        ...data,
        type: newType,
        retailPrice: RETAIL_PRICES[newType] ?? 0,
      });

      console.log(`➕ Créé ${data.name} (${newType}) avec retailPrice: ${RETAIL_PRICES[newType]}€`);
    }
  }

  console.log("🎉 Génération des types supplémentaires terminée !");
}

// Fonction principale
export async function seedFirestore() {
  console.log("⚡ Mise à jour des retailPrice et génération des nouveaux types...");
  await addRetailPriceToExistingItems();
  await generateAdditionalTypes();
  console.log("🎉 Seed complet !");
}
