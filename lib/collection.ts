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
  CollectionSnapshot,
  CollectionFormData,
  PurchaseMetadata,
} from "@/types/collection";
import type { Item } from "@/lib/analyse/types";

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
  if (formData.purchasePrice !== undefined && formData.purchasePrice > 0) {
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
