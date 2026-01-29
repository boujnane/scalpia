// types/collection.ts
import type { Item } from "@/lib/analyse/types";

/**
 * Represents a single item in the user's collection
 */
export type CollectionItem = {
  itemId: string;
  itemName: string;
  itemImage: string;
  itemType: Item["type"];
  itemBloc: string;
  quantity: number;
  addedAt: Date;
  updatedAt: Date;
  purchase?: PurchaseMetadata;
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
};

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
