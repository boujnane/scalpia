"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCollection } from "@/hooks/useCollection";
import { useAnalyseItems } from "@/hooks/useAnalyseItems";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AddItemSearchDialog from "@/components/collection/AddItemSearchDialog";
import AddCardSearchDialog from "@/components/collection/AddCardSearchDialog";
import { SeriesGrid } from "@/components/collection/SeriesGrid";
import { mapSetNameToFR } from "@/lib/cardmarket/setNameMapper";
import type { CMSet } from "@/lib/cardmarket/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  Table2,
  Search,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Wallet,
  PiggyBank,
  Target,
  Package,
} from "lucide-react";
import type { CollectionCardWithPrice, CollectionEntryWithPrice, CollectionItemWithPrice } from "@/types/collection";

type ViewMode = "grid" | "table";
type SortKey = "addedAt" | "value" | "profitLoss" | "name";
type CategoryFilter = "all" | "item" | "card";

export default function MaCollectionPage() {
  const { user, loading: authLoading } = useAuth();
  const { items: allItems, loading: itemsLoading, refresh: refreshAnalyseItems } = useAnalyseItems();
  const {
    items,
    cards,
    snapshots,
    summary,
    loading: collectionLoading,
    error,
    updateItem,
    removeItem,
    refresh: refreshCollection,
  } = useCollection(allItems);

  const [editingItem, setEditingItem] = useState<CollectionItemWithPrice | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editPurchasePrice, setEditPurchasePrice] = useState("");
  const [editPreOwned, setEditPreOwned] = useState(false);
  const [editOwnedSince, setEditOwnedSince] = useState("");
  const [editingCard, setEditingCard] = useState<CollectionCardWithPrice | null>(null);
  const [editCardQuantity, setEditCardQuantity] = useState(1);
  const [editCardPurchasePrice, setEditCardPurchasePrice] = useState("");
  const [editCardPreOwned, setEditCardPreOwned] = useState(false);
  const [editCardOwnedSince, setEditCardOwnedSince] = useState("");
  const [deletingEntry, setDeletingEntry] = useState<CollectionEntryWithPrice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [setLogosByName, setSetLogosByName] = useState<Record<string, string>>({});

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterCategory, setFilterCategory] = useState<CategoryFilter>("all");
  const [filterBloc, setFilterBloc] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("addedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const sortLabels: Record<SortKey, string> = {
    addedAt: "Date d'ajout",
    value: "Valeur",
    profitLoss: "Plus-value",
    name: "Nom",
  };
  const categoryLabels: Record<CategoryFilter, string> = {
    all: "Tous",
    item: "Produits",
    card: "Cartes",
  };

  const loading = authLoading || itemsLoading || collectionLoading;
  const totalEntries = items.length + cards.length;

  useEffect(() => {
    if (cards.length === 0) return;
    if (Object.keys(setLogosByName).length > 0) return;
    let cancelled = false;

    const fetchSetLogos = async () => {
      try {
        const res = await fetch("/api/cardmarket/sets/available");
        const data = await res.json().catch(() => null);
        const sets: CMSet[] = Array.isArray(data) ? data : data?.data || [];
        const next: Record<string, string> = {};

        for (const set of sets) {
          const frName = mapSetNameToFR(set.name);
          if (!set.logo) continue;
          if (!next[set.name]) {
            next[set.name] = set.logo;
          }
          if (!next[frName]) {
            next[frName] = set.logo;
          }
        }

        if (!cancelled) {
          setSetLogosByName(next);
        }
      } catch (err) {
        console.error("Erreur chargement logos séries:", err);
      }
    };

    fetchSetLogos();

    return () => {
      cancelled = true;
    };
  }, [cards.length, setLogosByName]);

  // Get unique blocs for filter
  const blocs = useMemo(() => {
    const uniqueBlocs = new Set<string>();
    for (const item of items) {
      uniqueBlocs.add(item.itemBloc);
    }
    for (const card of cards) {
      uniqueBlocs.add(mapSetNameToFR(card.setName));
    }
    return Array.from(uniqueBlocs).sort();
  }, [items, cards]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    if (filterCategory === "card") return [];

    let result = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.itemName.toLowerCase().includes(q) ||
          i.itemType.toLowerCase().includes(q) ||
          i.itemBloc.toLowerCase().includes(q)
      );
    }

    // Bloc filter
    if (filterBloc !== "all") {
      result = result.filter((i) => i.itemBloc === filterBloc);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "value":
          comparison = (a.currentValue ?? 0) - (b.currentValue ?? 0);
          break;
        case "profitLoss":
          comparison = (a.profitLoss ?? 0) - (b.profitLoss ?? 0);
          break;
        case "name":
          comparison = a.itemName.localeCompare(b.itemName);
          break;
        default:
          comparison = a.addedAt.getTime() - b.addedAt.getTime();
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });

    return result;
  }, [items, filterCategory, filterBloc, sortKey, sortDirection, searchQuery]);

  const filteredCards = useMemo(() => {
    if (filterCategory === "item") return [];

    let result = [...cards];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) => {
          const setLabel = mapSetNameToFR(c.setName).toLowerCase();
          return (
            c.cardName.toLowerCase().includes(q) ||
            (c.cardNumber ?? "").toLowerCase().includes(q) ||
            c.setName.toLowerCase().includes(q) ||
            setLabel.includes(q) ||
            (c.rarity ?? "").toLowerCase().includes(q)
          );
        }
      );
    }

    if (filterBloc !== "all") {
      result = result.filter((c) => mapSetNameToFR(c.setName) === filterBloc);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "value":
          comparison = (a.currentValue ?? 0) - (b.currentValue ?? 0);
          break;
        case "profitLoss":
          comparison = (a.profitLoss ?? 0) - (b.profitLoss ?? 0);
          break;
        case "name":
          comparison = a.cardName.localeCompare(b.cardName);
          break;
        default:
          comparison = a.addedAt.getTime() - b.addedAt.getTime();
      }
      return sortDirection === "desc" ? -comparison : comparison;
    });

    return result;
  }, [cards, filterCategory, filterBloc, sortKey, sortDirection, searchQuery]);

  const groupedCards = useMemo(() => {
    const groups = new Map<string, CollectionCardWithPrice[]>();
    for (const card of filteredCards) {
      const key = mapSetNameToFR(card.setName);
      const existing = groups.get(key);
      if (existing) {
        existing.push(card);
      } else {
        groups.set(key, [card]);
      }
    }
    return Array.from(groups.entries())
      .map(([setName, cards]) => ({ setName, cards }))
      .sort((a, b) => a.setName.localeCompare(b.setName));
  }, [filteredCards]);

  // Calculate filtered summary for KPIs
  const filteredSummary = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let totalQuantity = 0;

    for (const item of filteredItems) {
      if (item.currentValue !== null) {
        totalValue += item.currentValue;
      }
      if (item.purchase?.price && item.purchase.price > 0) {
        totalCost += item.purchase.price * item.quantity;
      } else if (item.retailPrice && item.retailPrice > 0) {
        totalCost += item.retailPrice * item.quantity;
      } else if (item.purchase?.totalCost) {
        totalCost += item.purchase.totalCost;
      }
      totalQuantity += item.quantity;
    }

    for (const card of filteredCards) {
      if (card.currentValue !== null) {
        totalValue += card.currentValue;
      }
      const costBasis = card.purchase?.totalCost && card.purchase.totalCost > 0
        ? card.purchase.totalCost
        : (card.purchase?.price && card.purchase.price > 0
          ? card.purchase.price * card.quantity
          : (card.priceAtPurchase && card.priceAtPurchase > 0
            ? card.priceAtPurchase * card.quantity
            : 0));
      if (costBasis > 0) {
        totalCost += costBasis;
      }
      totalQuantity += card.quantity;
    }

    const profitLoss = totalCost > 0 ? totalValue - totalCost : 0;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalItems: filteredItems.length + filteredCards.length,
      totalQuantity,
      profitLoss,
      profitLossPercent,
    };
  }, [filteredItems, filteredCards]);

  const filteredCount = filteredItems.length + filteredCards.length;

  // Prepare chart data (fallback to current value if no snapshots yet)
  const chartData = useMemo(() => {
    if (snapshots.length === 0 && (items.length > 0 || cards.length > 0)) {
      const today = new Date().toISOString().slice(0, 10);
      return [{
        date: today,
        value: summary.totalValue,
        cost: summary.totalCost,
      }];
    }

    return [...snapshots]
      .reverse()
      .map((s) => ({
        date: s.date,
        value: s.totalValue,
        cost: s.totalCost,
      }));
  }, [snapshots, items.length, cards.length, summary.totalValue, summary.totalCost]);

  const latestSnapshotDate = useMemo(() => {
    if (snapshots.length === 0) return null;
    let max = 0;
    for (const s of snapshots) {
      const time = new Date(s.date).getTime();
      if (!Number.isNaN(time)) max = Math.max(max, time);
    }
    return max ? new Date(max) : null;
  }, [snapshots]);

  const lastUpdatedLabel = latestSnapshotDate
    ? latestSnapshotDate.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : null;

  const hasSearch = searchQuery.trim().length > 0;
  const hasBlocFilter = filterBloc !== "all";
  const hasCategoryFilter = filterCategory !== "all";
  const hasCustomSort = sortKey !== "addedAt" || sortDirection !== "desc";
  const showItemsSection = filterCategory !== "card";
  const showCardsSection = filterCategory !== "item";

  // Handle sort toggle
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  // Handle edit
  const handleEdit = (item: CollectionItemWithPrice) => {
    setEditingItem(item);
    setEditQuantity(item.quantity);
    setEditPurchasePrice(item.purchase?.price?.toString() ?? "");
    // Check if item has ownedSince set (preOwned)
    const hasOwnedSince = !!item.ownedSince && item.ownedSince !== "1970-01-01";
    setEditPreOwned(!!item.ownedSince);
    setEditOwnedSince(hasOwnedSince ? item.ownedSince! : "");
  };

  const handleEditCard = (card: CollectionCardWithPrice) => {
    setEditingCard(card);
    setEditCardQuantity(card.quantity);
    setEditCardPurchasePrice(card.purchase?.price?.toString() ?? "");
    const hasOwnedSince = !!card.ownedSince && card.ownedSince !== "1970-01-01";
    setEditCardPreOwned(!!card.ownedSince);
    setEditCardOwnedSince(hasOwnedSince ? card.ownedSince! : "");
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;
    setSubmitting(true);

    const updates: Partial<Pick<CollectionItemWithPrice, "quantity" | "purchase" | "ownedSince">> = {
      quantity: editQuantity,
    };

    const trimmedPrice = editPurchasePrice.trim();
    if (trimmedPrice) {
      const price = parseFloat(trimmedPrice);
      if (!Number.isNaN(price) && price > 0) {
        updates.purchase = {
          price,
          totalCost: price * editQuantity,
          date: editingItem.purchase?.date ?? null,
          notes: editingItem.purchase?.notes ?? null,
        };
      } else {
        updates.purchase = {
          price: 0,
          totalCost: 0,
          date: null,
          notes: null,
        };
      }
    } else if (editingItem.purchase) {
      updates.purchase = {
        price: 0,
        totalCost: 0,
        date: null,
        notes: null,
      };
    }

    // Handle ownedSince
    if (editPreOwned) {
      updates.ownedSince = editOwnedSince || "1970-01-01";
    } else {
      updates.ownedSince = null;
    }

    const success = await updateItem(editingItem.itemId, updates);
    setSubmitting(false);
    if (success) setEditingItem(null);
  };

  const handleEditCardSubmit = async () => {
    if (!editingCard) return;
    setSubmitting(true);

    const updates: Partial<Pick<CollectionItemWithPrice, "quantity" | "purchase" | "ownedSince">> = {
      quantity: editCardQuantity,
    };

    const trimmedPrice = editCardPurchasePrice.trim();
    if (trimmedPrice) {
      const price = parseFloat(trimmedPrice);
      if (!Number.isNaN(price) && price > 0) {
        updates.purchase = {
          price,
          totalCost: price * editCardQuantity,
          date: editingCard.purchase?.date ?? null,
          notes: editingCard.purchase?.notes ?? null,
        };
      } else {
        updates.purchase = {
          price: 0,
          totalCost: 0,
          date: null,
          notes: null,
        };
      }
    } else if (editingCard.purchase) {
      updates.purchase = {
        price: 0,
        totalCost: 0,
        date: null,
        notes: null,
      };
    }

    if (editCardPreOwned) {
      updates.ownedSince = editCardOwnedSince || "1970-01-01";
    } else {
      updates.ownedSince = null;
    }

    const success = await updateItem(editingCard.cardId, updates);
    setSubmitting(false);
    if (success) setEditingCard(null);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingEntry) return;
    setSubmitting(true);
    const entryId = deletingEntry.category === "card" ? deletingEntry.cardId : deletingEntry.itemId;
    const success = await removeItem(entryId);
    setSubmitting(false);
    if (success) setDeletingEntry(null);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterCategory("all");
    setFilterBloc("all");
    setSortKey("addedAt");
    setSortDirection("desc");
  };

  // ═══════════════════════════════════════════════════════════
  // NOT LOGGED IN
  // ═══════════════════════════════════════════════════════════
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl" />
            <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/10 to-purple-500/10 w-28 h-28 mx-auto flex items-center justify-center border border-primary/20">
              <Icons.collection className="w-14 h-14 text-primary" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Ma collection
            </h1>
            <p className="text-muted-foreground text-lg">
              Suivez la valeur de vos produits Pokemon scellés en temps réel.
            </p>
          </div>
          <div className="space-y-3">
            <Button asChild size="lg" className="w-full sm:w-auto px-8">
              <Link href="/login">
                <Icons.user className="w-4 h-4 mr-2" />
                Se connecter
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Icons.collection className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-ping" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-semibold text-foreground">Chargement</p>
            <p className="text-sm text-muted-foreground">Calcul de la valeur de votre collection...</p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN PAGE
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      {/* ─────────────────────────────────────────────────────────
          HEADER
      ───────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col gap-6">
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/20">
                  <Icons.collection className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                    Ma Collection
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {summary.totalItems} élément{summary.totalItems > 1 ? "s" : ""} • {summary.totalQuantity} exemplaire{summary.totalQuantity > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <AddItemSearchDialog
                    buttonLabel="Ajouter un produit"
                    buttonVariant="default"
                    buttonClassName="w-fit h-8"
                  />
                  <AddCardSearchDialog
                    buttonLabel="Ajouter une carte"
                    buttonVariant="outline"
                    buttonClassName="w-fit h-8"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await refreshAnalyseItems();
                      await refreshCollection();
                    }}
                    className="w-fit"
                  >
                    <Icons.refreshCw className="w-4 h-4 mr-2" />
                    Actualiser
                  </Button>
                </div>
                {lastUpdatedLabel && (
                  <p className="text-xs text-muted-foreground">
                    Dernière MAJ : {lastUpdatedLabel}
                  </p>
                )}
              </div>
            </div>

            {/* KPI Cards */}
            {totalEntries > 0 && (
              <div className="space-y-2">
                {(hasSearch || hasBlocFilter || hasCategoryFilter) && (
                  <p className="text-xs text-muted-foreground">
                    Valeurs filtrées ({filteredSummary.totalItems} élément{filteredSummary.totalItems > 1 ? "s" : ""} • {filteredSummary.totalQuantity} exemplaire{filteredSummary.totalQuantity > 1 ? "s" : ""})
                  </p>
                )}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Valeur totale */}
                  <div className="col-span-2 sm:col-span-1 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-primary/20">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Valeur totale</p>
                        <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
                          {filteredSummary.totalValue.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Coût total */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-muted">
                        <PiggyBank className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Investi</p>
                        <p className="text-xl sm:text-2xl font-bold tabular-nums">
                          {filteredSummary.totalCost > 0
                            ? `${filteredSummary.totalCost.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Plus-value */}
                  <div className={`p-4 sm:p-5 rounded-2xl border ${
                    filteredSummary.profitLoss >= 0
                      ? "bg-success/5 border-success/20"
                      : "bg-destructive/5 border-destructive/20"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        filteredSummary.profitLoss >= 0 ? "bg-success/20" : "bg-destructive/20"
                      }`}>
                        {filteredSummary.profitLoss >= 0 ? (
                          <TrendingUp className="w-5 h-5 text-success" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">Plus-value</p>
                        <p className={`text-xl sm:text-2xl font-bold tabular-nums ${
                          filteredSummary.profitLoss >= 0 ? "text-success" : "text-destructive"
                        }`}>
                          {filteredSummary.totalCost > 0 ? (
                            <>
                              {filteredSummary.profitLoss >= 0 ? "+" : ""}
                              {filteredSummary.profitLoss.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                            </>
                          ) : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ROI */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-muted">
                        <Target className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-muted-foreground">ROI</p>
                        <p className={`text-xl sm:text-2xl font-bold tabular-nums ${
                          filteredSummary.profitLossPercent >= 0 ? "text-success" : "text-destructive"
                        }`}>
                          {filteredSummary.totalCost > 0 ? (
                            <>
                              {filteredSummary.profitLossPercent >= 0 ? "+" : ""}
                              {filteredSummary.profitLossPercent.toFixed(1)}%
                            </>
                          ) : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {totalEntries === 0 ? (
          // ═══════════════════════════════════════════════════════════
          // EMPTY STATE
          // ═══════════════════════════════════════════════════════════
          <div className="flex flex-col items-center justify-center py-16 sm:py-24">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-2xl scale-150" />
              <div className="relative p-8 rounded-full bg-gradient-to-br from-muted/80 to-muted/40 border border-border">
                <Package className="w-16 h-16 text-muted-foreground" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Votre collection est vide</h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Commencez à construire votre collection en ajoutant des produits scellés ou des cartes.
              Vous pourrez ensuite suivre leur valeur en temps réel.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg">
                <Link href="/analyse?tab=products">
                  <Icons.add className="w-4 h-4 mr-2" />
                  Explorer les produits
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/analyse">
                  <Icons.linechart className="w-4 h-4 mr-2" />
                  Voir le marché
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ─────────────────────────────────────────────────────────
                CHART
            ───────────────────────────────────────────────────────── */}
            {chartData.length > 0 && (
              <section className="bg-card border border-border rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Évolution de la valeur</h2>
                    <p className="text-sm text-muted-foreground">
                      Historique sur {chartData.length} jour{chartData.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                      stroke="var(--color-muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}€`}
                      stroke="var(--color-muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "var(--color-popover)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                      labelFormatter={(label) => new Date(label).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                      formatter={(value?: number) => [`${value?.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`, "Valeur"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </section>
            )}

            {/* ─────────────────────────────────────────────────────────
                TOOLBAR
            ───────────────────────────────────────────────────────── */}
            <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background/80 backdrop-blur border-b border-border/50">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  {/* Search & Filters */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <ToggleGroup
                    type="single"
                    value={filterCategory}
                    onValueChange={(v) => v && setFilterCategory(v as CategoryFilter)}
                    variant="outline"
                    size="sm"
                    className="flex"
                  >
                    <ToggleGroupItem value="all">Tous</ToggleGroupItem>
                    <ToggleGroupItem value="item">Produits</ToggleGroupItem>
                    <ToggleGroupItem value="card">Cartes</ToggleGroupItem>
                  </ToggleGroup>
                  <Select value={filterBloc} onValueChange={setFilterBloc}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Tous les blocs / séries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les blocs / séries</SelectItem>
                      {blocs.map((bloc) => (
                        <SelectItem key={bloc} value={bloc}>{bloc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>

                  {/* View Toggle & Sort */}
                  <div className="flex items-center gap-2">
                    <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                      <SelectTrigger className="w-[150px]">
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="addedAt">Date d'ajout</SelectItem>
                        <SelectItem value="value">Valeur</SelectItem>
                        <SelectItem value="profitLoss">Plus-value</SelectItem>
                        <SelectItem value="name">Nom</SelectItem>
                      </SelectContent>
                    </Select>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setSortDirection((d) => (d === "desc" ? "asc" : "desc"))}
                          aria-label="Changer l'ordre de tri"
                        >
                          {sortDirection === "desc" ? (
                            <ArrowDown className="w-4 h-4" />
                          ) : (
                            <ArrowUp className="w-4 h-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {sortDirection === "desc" ? "Tri décroissant" : "Tri croissant"}
                      </TooltipContent>
                    </Tooltip>
                    <ToggleGroup
                      type="single"
                      value={viewMode}
                      onValueChange={(v) => v && setViewMode(v as ViewMode)}
                      variant="outline"
                      size="sm"
                      className="hidden sm:flex"
                    >
                      <ToggleGroupItem value="grid" aria-label="Grille">
                        <LayoutGrid className="w-4 h-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="table" aria-label="Tableau" className="hidden md:inline-flex">
                        <Table2 className="w-4 h-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                </div>

                {/* Active filters + results */}
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {filteredCount} résultat{filteredCount > 1 ? "s" : ""}
                      {hasCategoryFilter && ` • ${categoryLabels[filterCategory]}`}
                      {hasBlocFilter && ` • ${filterBloc}`}
                    </Badge>
                    {hasSearch && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2 gap-1"
                        onClick={() => setSearchQuery("")}
                      >
                        <Icons.search className="w-3 h-3" />
                        “{searchQuery.trim()}”
                        <Icons.close className="w-3 h-3" />
                      </Button>
                    )}
                    {hasCategoryFilter && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2 gap-1"
                        onClick={() => setFilterCategory("all")}
                      >
                        {categoryLabels[filterCategory]}
                        <Icons.close className="w-3 h-3" />
                      </Button>
                    )}
                    {hasBlocFilter && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2 gap-1"
                        onClick={() => setFilterBloc("all")}
                      >
                        {filterBloc}
                        <Icons.close className="w-3 h-3" />
                      </Button>
                    )}
                    {hasCustomSort && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2 gap-1"
                        onClick={() => {
                          setSortKey("addedAt");
                          setSortDirection("desc");
                        }}
                      >
                        Tri: {sortLabels[sortKey]} ({sortDirection})
                        <Icons.close className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  {(hasSearch || hasBlocFilter || hasCategoryFilter || hasCustomSort) && (
                    <Button variant="ghost" size="sm" className="h-7" onClick={handleResetFilters}>
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {showItemsSection && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Produits scellés</h3>
                  <span className="text-xs text-muted-foreground">
                    {filteredItems.length} produit{filteredItems.length > 1 ? "s" : ""}
                  </span>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-muted/40 border border-border rounded-xl px-4 py-3">
                    Aucun produit ne correspond à vos filtres.
                  </div>
                ) : (
                  <>
                    {viewMode === "grid" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredItems.map((item, index) => (
                          <CollectionItemCard
                            key={item.itemId}
                            item={item}
                            index={index}
                            onEdit={() => handleEdit(item)}
                            onDelete={() => setDeletingEntry(item)}
                          />
                        ))}
                      </div>
                    )}

                    {viewMode === "table" && (
                      <>
                        <div className="md:hidden text-sm text-muted-foreground bg-muted/40 border border-border rounded-xl px-4 py-3">
                          La vue tableau est disponible sur écran large. Affichage en grille sur mobile.
                        </div>
                        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {filteredItems.map((item, index) => (
                            <CollectionItemCard
                              key={item.itemId}
                              item={item}
                              index={index}
                              onEdit={() => handleEdit(item)}
                              onDelete={() => setDeletingEntry(item)}
                            />
                          ))}
                        </div>
                        <div className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[300px]">Produit</TableHead>
                                <TableHead className="text-center">Qté</TableHead>
                                <TableHead className="text-right">Prix unitaire</TableHead>
                                <TableHead className="text-right">Valeur</TableHead>
                                <TableHead className="text-right">Plus-value</TableHead>
                                <TableHead className="text-right w-[100px]">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredItems.map((item) => (
                                <TableRow key={item.itemId}>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <div className="relative w-12 h-12 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0">
                                        {item.itemImage ? (
                                          <Image src={item.itemImage} alt={item.itemName} fill className="object-contain p-1" />
                                        ) : (
                                          <div className="flex items-center justify-center h-full">
                                            <Package className="w-5 h-5 text-muted-foreground" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-medium truncate">{item.itemType} {item.itemName}</p>
                                        <p className="text-xs text-muted-foreground truncate">{item.itemBloc}</p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="secondary">x{item.quantity}</Badge>
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">
                                    {item.currentPrice !== null ? `${item.currentPrice.toFixed(2)} €` : "—"}
                                  </TableCell>
                                  <TableCell className="text-right font-semibold text-primary tabular-nums">
                                    {item.currentValue !== null ? `${item.currentValue.toFixed(2)} €` : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.profitLoss !== null ? (
                                      <span className={`font-semibold tabular-nums ${item.profitLoss >= 0 ? "text-success" : "text-destructive"}`}>
                                        {item.profitLoss >= 0 ? "+" : ""}{item.profitLoss.toFixed(2)} €
                                      </span>
                                    ) : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(item)}>
                                            <Icons.edit className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Modifier</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="icon-sm" onClick={() => setDeletingEntry(item)}>
                                            <Icons.delete className="w-4 h-4 text-destructive" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Supprimer</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </>
                )}
              </section>
            )}

            {showCardsSection && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Cartes</h3>
                  <span className="text-xs text-muted-foreground">
                    {filteredCards.length} carte{filteredCards.length > 1 ? "s" : ""} • {groupedCards.length} série{groupedCards.length > 1 ? "s" : ""}
                  </span>
                </div>

                {filteredCards.length === 0 ? (
                  <div className="text-sm text-muted-foreground bg-muted/40 border border-border rounded-xl px-4 py-3">
                    Aucune carte ne correspond à vos filtres.
                  </div>
                ) : (
                  <SeriesGrid
                    groupedCards={groupedCards.map((group) => ({
                      ...group,
                      setName: group.setName,
                      cards: group.cards.map((card) => ({
                        ...card,
                        setName: mapSetNameToFR(card.setName),
                      })),
                    }))}
                    setLogosByName={setLogosByName}
                    onEditCard={handleEditCard}
                    onDeleteCard={(card) => setDeletingEntry(card)}
                  />
                )}
              </section>
            )}
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════
          EDIT DIALOG
      ═══════════════════════════════════════════════════════════ */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icons.edit className="w-5 h-5 text-primary" />
              Modifier l'article
            </DialogTitle>
            <DialogDescription>
              {editingItem?.itemType} {editingItem?.itemName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantité</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                  disabled={editQuantity <= 1}
                >
                  <Icons.minusCircle className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center tabular-nums"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setEditQuantity(editQuantity + 1)}
                >
                  <Icons.plusCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prix d'achat unitaire</label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={editPurchasePrice}
                  onChange={(e) => setEditPurchasePrice(e.target.value)}
                  className="pr-8 tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Laissez vide pour utiliser le prix retail comme référence d'achat.
              </p>
              {editPurchasePrice && editQuantity > 0 && (
                <p className="text-sm text-muted-foreground">
                  Coût total : <span className="font-medium text-foreground">
                    {(parseFloat(editPurchasePrice) * editQuantity).toFixed(2)} €
                  </span>
                </p>
              )}
            </div>

            {/* Pre-owned checkbox */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="editPreOwned"
                  checked={editPreOwned}
                  onCheckedChange={(checked) => setEditPreOwned(checked === true)}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <label htmlFor="editPreOwned" className="text-sm font-medium cursor-pointer">
                    Je possédais déjà cet article
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Cochez si cet article était déjà dans votre collection avant d'utiliser l'application.
                  </p>
                </div>
              </div>

              {editPreOwned && (
                <div className="space-y-2 pl-7">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Icons.calendar className="w-4 h-4 text-muted-foreground" />
                    Depuis quand ? (optionnel)
                  </label>
                  <Input
                    type="date"
                    value={editOwnedSince}
                    onChange={(e) => setEditOwnedSince(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Laissez vide pour l'inclure depuis le début de votre collection.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)} disabled={submitting}>
              Annuler
            </Button>
            <Button onClick={handleEditSubmit} disabled={submitting}>
              {submitting ? <Icons.spinner className="w-4 h-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          EDIT CARD DIALOG
      ═══════════════════════════════════════════════════════════ */}
      <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icons.edit className="w-5 h-5 text-primary" />
              Modifier la carte
            </DialogTitle>
            <DialogDescription>
              {editingCard?.cardName}
              {editingCard?.cardNumber ? ` · #${editingCard.cardNumber}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantité</label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setEditCardQuantity(Math.max(1, editCardQuantity - 1))}
                  disabled={editCardQuantity <= 1}
                >
                  <Icons.minusCircle className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={editCardQuantity}
                  onChange={(e) => setEditCardQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 text-center tabular-nums"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setEditCardQuantity(editCardQuantity + 1)}
                >
                  <Icons.plusCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prix d'achat unitaire</label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={editingCard?.priceAtPurchase ? editingCard.priceAtPurchase.toFixed(2) : "0.00"}
                  value={editCardPurchasePrice}
                  onChange={(e) => setEditCardPurchasePrice(e.target.value)}
                  className="pr-8 tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
              </div>
              {editingCard?.priceAtPurchase && !editCardPurchasePrice && (
                <p className="text-xs text-muted-foreground">
                  Prix à l'ajout : {editingCard.priceAtPurchase.toFixed(2)} €
                </p>
              )}
            </div>

            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="editCardPreOwned"
                  checked={editCardPreOwned}
                  onCheckedChange={(checked) => setEditCardPreOwned(checked === true)}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <label htmlFor="editCardPreOwned" className="text-sm font-medium cursor-pointer">
                    Je possédais déjà cette carte
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Cochez si cette carte était déjà dans votre collection avant d'utiliser l'application.
                  </p>
                </div>
              </div>

              {editCardPreOwned && (
                <div className="space-y-2 pl-7">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Icons.calendar className="w-4 h-4 text-muted-foreground" />
                    Depuis quand ? (optionnel)
                  </label>
                  <Input
                    type="date"
                    value={editCardOwnedSince}
                    onChange={(e) => setEditCardOwnedSince(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Laissez vide pour l'inclure depuis le début de votre collection.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCard(null)} disabled={submitting}>
              Annuler
            </Button>
            <Button onClick={handleEditCardSubmit} disabled={submitting}>
              {submitting ? <Icons.spinner className="w-4 h-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════
          DELETE DIALOG
      ═══════════════════════════════════════════════════════════ */}
      <AlertDialog open={!!deletingEntry} onOpenChange={(open) => !open && setDeletingEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingEntry?.category === "card" ? "Supprimer cette carte ?" : "Supprimer cet article ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">
                {deletingEntry?.category === "card"
                  ? deletingEntry?.cardName
                  : `${deletingEntry?.itemType} ${deletingEntry?.itemName}`}
              </span>{" "}
              sera retiré de votre collection. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <Icons.spinner className="w-4 h-4 animate-spin" /> : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COLLECTION CARD COMPONENT
// ═══════════════════════════════════════════════════════════
function CollectionItemCard({
  item,
  index = 0,
  onEdit,
  onDelete,
}: {
  item: CollectionItemWithPrice;
  index?: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasInvestmentBasis =
    (item.purchase?.price !== undefined && item.purchase.price > 0) ||
    (item.retailPrice !== null && item.retailPrice > 0) ||
    (item.purchase?.totalCost !== undefined && item.purchase.totalCost > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    >
      {/* Image Section */}
      <div className="relative h-36 bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
        {item.itemImage ? (
          <Image
            src={item.itemImage}
            alt={item.itemName}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package className="w-16 h-16 text-muted-foreground/50" />
        )}
        {/* Quantity badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="font-bold shadow-sm">
            x{item.quantity}
          </Badge>
        </div>
        {/* Profit indicator */}
        {hasInvestmentBasis && item.profitLoss !== null && (
          <div className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            item.profitLoss >= 0
              ? "bg-success/20 text-success"
              : "bg-destructive/20 text-destructive"
          }`}>
            {item.profitLoss >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {item.profitLossPercent !== null ? `${item.profitLossPercent >= 0 ? "+" : ""}${item.profitLossPercent.toFixed(1)}%` : ""}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div>
          <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
            {item.itemType} {item.itemName}
          </h3>
          <p className="text-xs text-muted-foreground truncate">{item.itemBloc}</p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Valeur</p>
            <p className="text-lg font-bold text-primary tabular-nums">
              {item.currentValue !== null
                ? `${item.currentValue.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
                : "N/A"}
            </p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {hasInvestmentBasis ? "Plus-value" : "Prix unit."}
            </p>
            {hasInvestmentBasis ? (
              <p className={`text-lg font-bold tabular-nums ${
                (item.profitLoss ?? 0) >= 0 ? "text-success" : "text-destructive"
              }`}>
                {item.profitLoss !== null
                  ? `${item.profitLoss >= 0 ? "+" : ""}${item.profitLoss.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`
                  : "N/A"}
              </p>
            ) : (
              <p className="text-lg font-bold tabular-nums">
                {item.currentPrice !== null ? `${item.currentPrice.toFixed(2)} €` : "N/A"}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Prix retail</span>
            <span className="font-medium tabular-nums text-foreground">
              {item.retailPrice && item.retailPrice > 0
                ? `${item.retailPrice.toFixed(2)} €`
                : "—"}
            </span>
          </div>
          {item.purchase?.price && item.purchase.price > 0 && (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Prix d'achat réel</span>
              <span className="font-medium tabular-nums text-foreground">
                {item.purchase.price.toFixed(2)} €
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
            onClick={onEdit}
          >
            <Icons.edit className="w-4 h-4 mr-1.5" />
            Modifier
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={onDelete}
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <Icons.delete className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Supprimer</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.div>
  );
}
