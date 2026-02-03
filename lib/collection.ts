// lib/collection.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  CollectionItem,
  CollectionCard,
  CollectionEntry,
  CollectionSnapshot,
  CollectionFormData,
  PurchaseMetadata,
} from "@/types/collection";
import type { Item } from "@/lib/analyse/types";
import type { CMCard } from "@/lib/cardmarket/types";

/**
 * Get the collection reference for a user
 */
function getUserCollectionRef(userId: string) {
  return collection(db, "users", userId, "collection");
}

/**
 * Get the snapshots reference for a user
 */
function getUserSnapshotsRef(userId: string) {
  return collection(db, "users", userId, "collection-snapshots");
}

/**
 * Parse Firestore timestamp to Date
 */
function parseTimestamp(val: unknown): Date {
  if (typeof val === "object" && val !== null && "toDate" in val) {
    return (val as { toDate: () => Date }).toDate();
  }
  if (val instanceof Date) return val;
  return new Date();
}

/**
 * Generate a stable item ID from item data
 */
export function generateItemId(item: Item): string {
  return `${item.type}-${item.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Add or update an item in the user's collection
 */
export async function addToCollection(
  userId: string,
  item: Item,
  formData: CollectionFormData
): Promise<void> {
  const itemId = generateItemId(item);
  const docRef = doc(getUserCollectionRef(userId), itemId);

  const existing = await getDoc(docRef);
  const now = serverTimestamp();

  let purchase: PurchaseMetadata | undefined;
  if (formData.purchasePrice !== undefined && Number.isFinite(formData.purchasePrice)) {
    purchase = {
      price: formData.purchasePrice,
      totalCost: formData.purchasePrice * formData.quantity,
      date: formData.purchaseDate ?? null,
      notes: formData.notes ?? null,
    };
  }

  if (existing.exists()) {
    // Update existing item
    const existingData = existing.data() as CollectionItem;
    const newQuantity = existingData.quantity + formData.quantity;

    // Merge purchase data if provided
    let mergedPurchase = existingData.purchase;
    if (purchase) {
      const existingCost = existingData.purchase?.totalCost ?? 0;
      mergedPurchase = {
        price: purchase.price,
        totalCost: existingCost + purchase.totalCost,
        date: purchase.date ?? existingData.purchase?.date ?? null,
        notes: purchase.notes ?? existingData.purchase?.notes ?? null,
      };
    }

    // Build update object, only including purchase if defined
    const updateData: Record<string, unknown> = {
      ...existingData,
      category: "item",
      quantity: newQuantity,
      updatedAt: now,
    };

    if (mergedPurchase) {
      updateData.purchase = mergedPurchase;
    }

    // Update ownedSince if provided (keep existing if not)
    if (formData.preOwned && formData.ownedSince) {
      updateData.ownedSince = formData.ownedSince;
    } else if (formData.preOwned && !formData.ownedSince) {
      // preOwned without date = use earliest possible date
      updateData.ownedSince = "1970-01-01";
    }

    await setDoc(docRef, updateData, { merge: true });
  } else {
    // Create new entry - only include purchase if defined
    const newItem: Record<string, unknown> = {
      category: "item",
      itemId,
      itemName: item.name,
      itemImage: item.image ?? "",
      itemType: item.type,
      itemBloc: item.bloc,
      quantity: formData.quantity,
      addedAt: now,
      updatedAt: now,
    };

    if (purchase) {
      newItem.purchase = {
        price: purchase.price,
        totalCost: purchase.totalCost,
        date: purchase.date ?? null,
        notes: purchase.notes ?? null,
      };
    }

    // Add ownedSince if preOwned
    if (formData.preOwned) {
      newItem.ownedSince = formData.ownedSince ?? "1970-01-01";
    }

    await setDoc(docRef, newItem);
  }
}

/**
 * Update an existing collection item
 */
export async function updateCollectionItem(
  userId: string,
  itemId: string,
  updates: Partial<Pick<CollectionItem, "quantity" | "purchase" | "ownedSince">>
): Promise<void> {
  const docRef = doc(getUserCollectionRef(userId), itemId);

  await setDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Update any collection entry (item or card) with arbitrary fields
 */
export async function updateCollectionEntry(
  userId: string,
  entryId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const docRef = doc(getUserCollectionRef(userId), entryId);

  await setDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Remove an item from the collection
 */
export async function removeFromCollection(
  userId: string,
  itemId: string
): Promise<void> {
  const docRef = doc(getUserCollectionRef(userId), itemId);
  await deleteDoc(docRef);
}

/**
 * Get all items in the user's collection
 */
export async function getCollection(userId: string): Promise<CollectionItem[]> {
  const q = query(
    getUserCollectionRef(userId),
    orderBy("addedAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      category: "item",
      itemId: data.itemId,
      itemName: data.itemName,
      itemImage: data.itemImage,
      itemType: data.itemType,
      itemBloc: data.itemBloc,
      quantity: data.quantity,
      addedAt: parseTimestamp(data.addedAt),
      updatedAt: parseTimestamp(data.updatedAt),
      purchase: data.purchase,
      ownedSince: data.ownedSince ?? null,
    } as CollectionItem;
  });
}

/**
 * Get a single collection item
 */
export async function getCollectionItem(
  userId: string,
  itemId: string
): Promise<CollectionItem | null> {
  const docRef = doc(getUserCollectionRef(userId), itemId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    category: "item",
    itemId: data.itemId,
    itemName: data.itemName,
    itemImage: data.itemImage,
    itemType: data.itemType,
    itemBloc: data.itemBloc,
    quantity: data.quantity,
    addedAt: parseTimestamp(data.addedAt),
    updatedAt: parseTimestamp(data.updatedAt),
    purchase: data.purchase,
    ownedSince: data.ownedSince ?? null,
  } as CollectionItem;
}

/**
 * Check if an item exists in the collection
 */
export async function isInCollection(
  userId: string,
  item: Item
): Promise<boolean> {
  const itemId = generateItemId(item);
  const docRef = doc(getUserCollectionRef(userId), itemId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists();
}

/**
 * Save a collection value snapshot
 */
export async function saveCollectionSnapshot(
  userId: string,
  snapshot: Omit<CollectionSnapshot, "createdAt">
): Promise<void> {
  const docRef = doc(getUserSnapshotsRef(userId), snapshot.date);

  await setDoc(docRef, {
    ...snapshot,
    createdAt: serverTimestamp(),
  });
}

/**
 * Get collection snapshots (most recent first)
 */
export async function getCollectionSnapshots(
  userId: string,
  maxDays: number = 90
): Promise<CollectionSnapshot[]> {
  const q = query(
    getUserSnapshotsRef(userId),
    orderBy("date", "desc"),
    limit(maxDays)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      date: data.date,
      totalValue: data.totalValue,
      totalCost: data.totalCost,
      itemCount: data.itemCount,
      createdAt: parseTimestamp(data.createdAt),
    } as CollectionSnapshot;
  });
}

/**
 * Delete snapshots before a given date
 */
export async function deleteSnapshotsBefore(
  userId: string,
  beforeDate: string
): Promise<number> {
  const q = query(
    getUserSnapshotsRef(userId),
    orderBy("date", "asc")
  );

  const snapshot = await getDocs(q);
  let deletedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.date < beforeDate) {
      await deleteDoc(docSnap.ref);
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Get today's snapshot if it exists
 */
export async function getTodaySnapshot(
  userId: string
): Promise<CollectionSnapshot | null> {
  const today = new Date().toISOString().slice(0, 10);
  const docRef = doc(getUserSnapshotsRef(userId), today);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  return {
    date: data.date,
    totalValue: data.totalValue,
    totalCost: data.totalCost,
    itemCount: data.itemCount,
    createdAt: parseTimestamp(data.createdAt),
  } as CollectionSnapshot;
}

// ═══════════════════════════════════════════════════════════
// Card-specific functions
// ═══════════════════════════════════════════════════════════

/**
 * Generate a stable card ID from card data
 */
export function generateCardId(card: CMCard): string {
  // Use cardmarketId if available, otherwise use name+set
  const cmId = card.cardmarketId ?? card.id;
  if (cmId) {
    return `card-${cmId}`;
  }
  const setName = card.episode?.name ?? "unknown";
  return `card-${card.name}-${setName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Add or update a card in the user's collection
 */
export async function addCardToCollection(
  userId: string,
  card: CMCard,
  formData: CollectionFormData
): Promise<void> {
  const cardId = generateCardId(card);
  const docRef = doc(getUserCollectionRef(userId), cardId);

  const existing = await getDoc(docRef);
  const now = serverTimestamp();

  // Get current price FR for storing at purchase
  const priceFR = card.prices?.fr ?? card.prices?.avg7 ?? null;

  let purchase: PurchaseMetadata | undefined;
  if (formData.purchasePrice !== undefined && Number.isFinite(formData.purchasePrice)) {
    purchase = {
      price: formData.purchasePrice,
      totalCost: formData.purchasePrice * formData.quantity,
      date: formData.purchaseDate ?? null,
      notes: formData.notes ?? null,
    };
  }

  if (existing.exists()) {
    // Update existing card
    const existingData = existing.data() as CollectionCard;
    const newQuantity = existingData.quantity + formData.quantity;

    // Merge purchase data if provided
    let mergedPurchase = existingData.purchase;
    if (purchase) {
      const existingCost = existingData.purchase?.totalCost ?? 0;
      mergedPurchase = {
        price: purchase.price,
        totalCost: existingCost + purchase.totalCost,
        date: purchase.date ?? existingData.purchase?.date ?? null,
        notes: purchase.notes ?? existingData.purchase?.notes ?? null,
      };
    }

    const updateData: Record<string, unknown> = {
      ...existingData,
      category: "card",
      quantity: newQuantity,
      updatedAt: now,
    };

    if (card.cardmarket_url && !existingData.cardmarketUrl) {
      const raw = card.cardmarket_url;
      const withLang = raw.includes("?") ? `${raw}&language=2` : `${raw}?language=2`;
      updateData.cardmarketUrl = withLang;
    }
    if (card.tcggo_url && !existingData.tcggoUrl) {
      updateData.tcggoUrl = card.tcggo_url;
    }

    if (mergedPurchase) {
      updateData.purchase = mergedPurchase;
    }

    if (formData.preOwned && formData.ownedSince) {
      updateData.ownedSince = formData.ownedSince;
    } else if (formData.preOwned && !formData.ownedSince) {
      updateData.ownedSince = "1970-01-01";
    }

    await setDoc(docRef, updateData, { merge: true });
  } else {
    // Create new card entry
    const newCard: Record<string, unknown> = {
      category: "card",
      cardId,
      cardmarketId: card.cardmarketId ?? card.id ?? null,
      cardmarketUrl: card.cardmarket_url
        ? (card.cardmarket_url.includes("?")
          ? `${card.cardmarket_url}&language=2`
          : `${card.cardmarket_url}?language=2`)
        : null,
      tcggoUrl: card.tcggo_url ?? null,
      cardName: card.name,
      cardImage: card.image ?? "",
      cardNumber: card.card_number ?? null,
      rarity: card.rarity ?? null,
      setName: card.episode?.name ?? "Unknown",
      setId: null, // Could be populated if we have set ID
      quantity: formData.quantity,
      addedAt: now,
      updatedAt: now,
      priceAtPurchase: priceFR,
    };

    if (purchase) {
      newCard.purchase = {
        price: purchase.price,
        totalCost: purchase.totalCost,
        date: purchase.date ?? null,
        notes: purchase.notes ?? null,
      };
    }

    if (formData.preOwned) {
      newCard.ownedSince = formData.ownedSince ?? "1970-01-01";
    }

    await setDoc(docRef, newCard);
  }
}

/**
 * Get all entries (items + cards) in the user's collection
 */
export async function getCollectionEntries(userId: string): Promise<CollectionEntry[]> {
  const q = query(
    getUserCollectionRef(userId),
    orderBy("addedAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    // Determine type based on category field or presence of itemId/cardId
    const category = data.category ?? (data.itemId ? "item" : "card");

    if (category === "card") {
      return {
        category: "card",
        cardId: data.cardId,
        cardmarketId: data.cardmarketId ?? undefined,
        cardmarketUrl: data.cardmarketUrl ?? null,
        tcggoUrl: data.tcggoUrl ?? null,
        cardName: data.cardName,
        cardImage: data.cardImage,
        cardNumber: data.cardNumber ?? undefined,
        rarity: data.rarity ?? undefined,
        setName: data.setName,
        setId: data.setId ?? undefined,
        quantity: data.quantity,
        addedAt: parseTimestamp(data.addedAt),
        updatedAt: parseTimestamp(data.updatedAt),
        purchase: data.purchase,
        ownedSince: data.ownedSince ?? null,
        priceAtPurchase: data.priceAtPurchase ?? undefined,
      } as CollectionCard;
    }

    return {
      category: "item",
      itemId: data.itemId,
      itemName: data.itemName,
      itemImage: data.itemImage,
      itemType: data.itemType,
      itemBloc: data.itemBloc,
      quantity: data.quantity,
      addedAt: parseTimestamp(data.addedAt),
      updatedAt: parseTimestamp(data.updatedAt),
      purchase: data.purchase,
      ownedSince: data.ownedSince ?? null,
    } as CollectionItem;
  });
}

/**
 * Check if a card exists in the collection
 */
export async function isCardInCollection(
  userId: string,
  card: CMCard
): Promise<boolean> {
  const cardId = generateCardId(card);
  const docRef = doc(getUserCollectionRef(userId), cardId);
  const snapshot = await getDoc(docRef);
  return snapshot.exists();
}

/**
 * Get a single card from the collection
 */
export async function getCollectionCard(
  userId: string,
  cardId: string
): Promise<CollectionCard | null> {
  const docRef = doc(getUserCollectionRef(userId), cardId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  if (data.category !== "card") return null;

  return {
    category: "card",
    cardId: data.cardId,
    cardmarketId: data.cardmarketId ?? undefined,
    cardName: data.cardName,
    cardImage: data.cardImage,
    cardNumber: data.cardNumber ?? undefined,
    rarity: data.rarity ?? undefined,
    setName: data.setName,
    setId: data.setId ?? undefined,
    quantity: data.quantity,
    addedAt: parseTimestamp(data.addedAt),
    updatedAt: parseTimestamp(data.updatedAt),
    purchase: data.purchase,
    ownedSince: data.ownedSince ?? null,
    priceAtPurchase: data.priceAtPurchase ?? undefined,
  } as CollectionCard;
}
