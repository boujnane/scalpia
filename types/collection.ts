// types/collection.ts
import type { Item } from "@/lib/analyse/types";

/**
 * Category discriminator for collection entries
 */
export type CollectionCategory = "item" | "card";

/**
 * Represents a single item (sealed product) in the user's collection
 */
export type CollectionItem = {
  category: "item";
  itemId: string;
  itemName: string;
  itemImage: string;
  itemType: Item["type"];
  itemBloc: string;
  quantity: number;
  addedAt: Date;
  updatedAt: Date;
  purchase?: PurchaseMetadata;
  /** Date depuis laquelle l'item est possédé (format YYYY-MM-DD). Si défini, utilisé pour les calculs de croissance au lieu de addedAt */
  ownedSince?: string | null;
};

/**
 * Represents a single card in the user's collection
 */
export type CollectionCard = {
  category: "card";
  cardId: string;
  cardmarketId?: number;
  cardmarketUrl?: string | null;
  tcggoUrl?: string | null;
  cardName: string;
  cardImage: string;
  cardNumber?: string;
  rarity?: string;
  setName: string;
  setId?: string;
  quantity: number;
  addedAt: Date;
  updatedAt: Date;
  purchase?: PurchaseMetadata;
  ownedSince?: string | null;
  /** Prix FR au moment de l'ajout (pour calcul de plus-value) */
  priceAtPurchase?: number;
};

/**
 * Optional purchase metadata for collection items
 * Note: Uses null instead of undefined for Firestore compatibility
 */
export type PurchaseMetadata = {
  price: number;
  totalCost: number;
  date?: string | null;
  notes?: string | null;
};

/**
 * Daily snapshot of collection value
 */
export type CollectionSnapshot = {
  date: string;
  totalValue: number;
  totalCost: number;
  itemCount: number;
  createdAt: Date;
  /** Valeur des items (scellés) seulement - pour historique */
  itemsValue?: number;
  /** Valeur des cartes seulement - disponible à partir du moment où on stocke */
  cardsValue?: number;
  /** Nombre de cartes */
  cardsCount?: number;
};

/**
 * Collection summary with computed values
 */
export type CollectionSummary = {
  totalValue: number;
  totalCost: number;
  totalItems: number;
  totalQuantity: number;
  profitLoss: number;
  profitLossPercent: number;
};

/**
 * Form data for adding/editing collection items
 */
export type CollectionFormData = {
  quantity: number;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
  /** Si true, l'item était déjà possédé avant l'ajout */
  preOwned?: boolean;
  /** Date depuis laquelle l'item est possédé (format YYYY-MM-DD) */
  ownedSince?: string;
};

/**
 * Unified collection entry type
 */
export type CollectionEntry = CollectionItem | CollectionCard;

/**
 * Collection item with current price info
 */
export type CollectionItemWithPrice = CollectionItem & {
  currentPrice: number | null;
  currentValue: number | null;
  profitLoss: number | null;
  profitLossPercent: number | null;
  retailPrice: number | null;
};

/**
 * Collection card with current price info
 */
export type CollectionCardWithPrice = CollectionCard & {
  currentPrice: number | null;
  currentValue: number | null;
  profitLoss: number | null;
  profitLossPercent: number | null;
};

/**
 * Unified collection entry with price info
 */
export type CollectionEntryWithPrice = CollectionItemWithPrice | CollectionCardWithPrice;

/**
 * Type guard for collection item
 */
export function isCollectionItem(entry: CollectionEntry): entry is CollectionItem {
  return entry.category === "item";
}

/**
 * Type guard for collection card
 */
export function isCollectionCard(entry: CollectionEntry): entry is CollectionCard {
  return entry.category === "card";
}

/**
 * Type guard for collection item with price
 */
export function isCollectionItemWithPrice(entry: CollectionEntryWithPrice): entry is CollectionItemWithPrice {
  return entry.category === "item";
}

/**
 * Type guard for collection card with price
 */
export function isCollectionCardWithPrice(entry: CollectionEntryWithPrice): entry is CollectionCardWithPrice {
  return entry.category === "card";
}
