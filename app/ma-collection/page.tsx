"use client";

import { useState, useMemo } from "react";
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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  LayoutGrid,
  Table2,
  Search,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  Wallet,
  PiggyBank,
  Target,
  Package,
} from "lucide-react";
import type { CollectionItemWithPrice } from "@/types/collection";

type ViewMode = "grid" | "table";
type SortKey = "addedAt" | "value" | "profitLoss" | "name";

export default function MaCollectionPage() {
  const { user, loading: authLoading } = useAuth();
  const { items: allItems, loading: itemsLoading } = useAnalyseItems();
  const {
    items,
    snapshots,
    summary,
    loading: collectionLoading,
    error,
    updateItem,
    removeItem,
    refresh,
  } = useCollection(allItems);

  const [editingItem, setEditingItem] = useState<CollectionItemWithPrice | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editPurchasePrice, setEditPurchasePrice] = useState("");
  const [editPreOwned, setEditPreOwned] = useState(false);
  const [editOwnedSince, setEditOwnedSince] = useState("");
  const [deletingItem, setDeletingItem] = useState<CollectionItemWithPrice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
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

  const loading = authLoading || itemsLoading || collectionLoading;

  // Get unique blocs for filter
  const blocs = useMemo(() => {
    const uniqueBlocs = new Set(items.map((i) => i.itemBloc));
    return Array.from(uniqueBlocs).sort();
  }, [items]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
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
  }, [items, filterBloc, sortKey, sortDirection, searchQuery]);

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

    const profitLoss = totalCost > 0 ? totalValue - totalCost : 0;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalItems: filteredItems.length,
      totalQuantity,
      profitLoss,
      profitLossPercent,
    };
  }, [filteredItems]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return [...snapshots]
      .reverse()
      .map((s) => ({
        date: s.date,
        value: s.totalValue,
        cost: s.totalCost,
      }));
  }, [snapshots]);

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
  const hasCustomSort = sortKey !== "addedAt" || sortDirection !== "desc";

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

  // Handle delete
  const handleDelete = async () => {
    if (!deletingItem) return;
    setSubmitting(true);
    const success = await removeItem(deletingItem.itemId);
    setSubmitting(false);
    if (success) setDeletingItem(null);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
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
                    {summary.totalItems} produit{summary.totalItems > 1 ? "s" : ""} • {summary.totalQuantity} article{summary.totalQuantity > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <AddItemSearchDialog
                    buttonLabel="Ajouter"
                    buttonVariant="default"
                    buttonClassName="w-fit h-8"
                  />
                  <Button variant="outline" size="sm" onClick={refresh} className="w-fit">
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
            {items.length > 0 && (
              <div className="space-y-2">
                {(hasSearch || hasBlocFilter) && (
                  <p className="text-xs text-muted-foreground">
                    Valeurs filtrées ({filteredSummary.totalItems} produit{filteredSummary.totalItems > 1 ? "s" : ""} • {filteredSummary.totalQuantity} article{filteredSummary.totalQuantity > 1 ? "s" : ""})
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
        {items.length === 0 ? (
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
              Commencez à construire votre collection en ajoutant des produits depuis la page d'analyse.
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
            {chartData.length > 1 && (
              <section className="bg-card border border-border rounded-2xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">Évolution de la valeur</h2>
                    <p className="text-sm text-muted-foreground">Historique sur {chartData.length} jours</p>
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
                    <Select value={filterBloc} onValueChange={setFilterBloc}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Toutes les séries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les séries</SelectItem>
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
                      {filteredItems.length} résultat{filteredItems.length > 1 ? "s" : ""}
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
                  {(hasSearch || hasBlocFilter || hasCustomSort) && (
                    <Button variant="ghost" size="sm" className="h-7" onClick={handleResetFilters}>
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────
                GRID VIEW
            ───────────────────────────────────────────────────────── */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <CollectionCard
                    key={item.itemId}
                    item={item}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => setDeletingItem(item)}
                  />
                ))}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────
                TABLE VIEW
            ───────────────────────────────────────────────────────── */}
            {viewMode === "table" && (
              <>
                <div className="md:hidden text-sm text-muted-foreground bg-muted/40 border border-border rounded-xl px-4 py-3">
                  La vue tableau est disponible sur écran large. Affichage en grille sur mobile.
                </div>
                <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredItems.map((item) => (
                    <CollectionCard
                      key={item.itemId}
                      item={item}
                      onEdit={() => handleEdit(item)}
                      onDelete={() => setDeletingItem(item)}
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
                                  <Button variant="ghost" size="icon-sm" onClick={() => setDeletingItem(item)}>
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
          DELETE DIALOG
      ═══════════════════════════════════════════════════════════ */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{deletingItem?.itemType} {deletingItem?.itemName}</span> sera retiré de votre collection. Cette action est irréversible.
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
function CollectionCard({
  item,
  onEdit,
  onDelete,
}: {
  item: CollectionItemWithPrice;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hasInvestmentBasis =
    (item.purchase?.price !== undefined && item.purchase.price > 0) ||
    (item.retailPrice !== null && item.retailPrice > 0) ||
    (item.purchase?.totalCost !== undefined && item.purchase.totalCost > 0);

  return (
    <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
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
    </div>
  );
}
