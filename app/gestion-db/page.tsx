"use client";

import { useEffect, useState, useMemo } from "react";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Separator } from "@/components/ui/separator";

// Icons
import { 
  Loader2, 
  Search, 
  Pencil, 
  Trash2, 
  ArrowUpDown, 
  ExternalLink 
} from "lucide-react";
import ProtectedPage from "@/components/ProtectedPage";

// --- TYPES ---
export type Item = {
  id: string;
  name: string;
  type: string;
  bloc: string;
  releaseDate: string;
  retailPrice: number;
  cardmarketUrl?: string | null;
  image?: string;
  createdAt?: string;
};

export type PriceEntry = {
  id: string; // Firestore ID ou local
  date: string;
  price: number;
};

type PriceChange = {
  type: 'add' | 'update' | 'delete';
  id: string; // identifiant unique (date ou uuid)
  date: string;
  price?: number;
};

// --- COMPONENT PRINCIPAL ---
export default function ItemsAdminPage() {
  // --- STATE ---
  const [items, setItems] = useState<Item[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  
  const [createForm, setCreateForm] = useState<Omit<Item, "id"> & { initialPrice?: number }>({
    name: "", type: "", bloc: "", releaseDate: "", retailPrice: 0, cardmarketUrl: "", image: "", initialPrice: undefined,
  });

  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = useState<Item | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [newPrice, setNewPrice] = useState<number | undefined>(undefined);
  const [historicPrices, setHistoricPrices] = useState<PriceEntry[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [editingPriceEntry, setEditingPriceEntry] = useState<PriceEntry | null>(null);
  
  const [pendingPriceChanges, setPendingPriceChanges] = useState<PriceChange[]>([]);
  const [hasUnsavedPriceChanges, setHasUnsavedPriceChanges] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof Item; direction: "asc" | "desc" } | null>(null);

  // --- DATA FETCHING ---
  const fetchItems = async () => {
    setItemsLoading(true);
    try {
      const q = query(collection(db, "items"));
      const snap = await getDocs(q);
      const data: Item[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Item, "id">),
      }));
      setItems(data);
    } catch (error) {
      console.error("Erreur fetch:", error);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchHistoricPrices = async (itemId: string) => {
    setPricesLoading(true);
    try {
      const pricesRef = collection(db, `items/${itemId}/prices`);
      const q = query(pricesRef, orderBy("date", "desc")); 
      const snap = await getDocs(q);
      
      const data: PriceEntry[] = snap.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<PriceEntry, "id">)
      }));
      
      setHistoricPrices(data);
      setPendingPriceChanges([]);
      setHasUnsavedPriceChanges(false);
    } catch (error) {
      console.error("Erreur fetch prices:", error);
      setHistoricPrices([]);
    } finally {
      setPricesLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);
  
  const handleEditDialogChange = (open: boolean) => {
    if (!open) {
      setEditingItem(null);
      setNewPrice(undefined);
      setHistoricPrices([]);
      setEditingPriceEntry(null);
      setPendingPriceChanges([]);
      setHasUnsavedPriceChanges(false);
    }
  }

  // --- HANDLERS (CREATE ITEM) ---
  const handleCreateChange = (key: string, value: any) => {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.type || !createForm.bloc) return;
    setActionLoading(true);
  
    try {
      const { initialPrice, ...itemData } = createForm;
  
      const itemRef = await addDoc(collection(db, "items"), {
        ...itemData,
        retailPrice: Number(itemData.retailPrice),
        createdAt: new Date().toISOString(),
      });
  
      // Historique de prix (optionnel)
      if (initialPrice !== undefined && !Number.isNaN(initialPrice)) {
        const today = new Date().toISOString().slice(0, 10);
  
        await setDoc(
          doc(db, "items", itemRef.id, "prices", today),
          {
            date: today,
            price: Number(initialPrice),
          }
        );
      }
  
      // reset form
      setCreateForm({
        name: "",
        type: "",
        bloc: "",
        releaseDate: "",
        retailPrice: 0,
        cardmarketUrl: "",
        image: "",
        initialPrice: undefined,
      });
  
      await fetchItems();
    } catch (err) {
      console.error("Erreur création item :", err);
      alert("Erreur lors de la création de l'item (voir console)");
    } finally {
      setActionLoading(false);
    }
  };
  

  // --- UPDATE ITEM ---
  const handleUpdate = async () => {
    if (!editingItem) return;
    setActionLoading(true);
    try {
      const docRef = doc(db, "items", editingItem.id);
      const { id, ...dataToUpdate } = editingItem;
      
      await updateDoc(docRef, {
        ...dataToUpdate,
        retailPrice: Number(dataToUpdate.retailPrice)
      });
      
      setItems((prev) => prev.map(item => item.id === id ? editingItem : item));
    } catch (err) {
      console.error("Erreur update item:", err);
    } finally {
      setActionLoading(false);
    }
  };
  
  // --- HANDLERS PRIX ---
  const handleAddNewPrice = () => {
    if (newPrice === undefined || Number.isNaN(newPrice) || newPrice <= 0) return;
    const today = new Date().toISOString().slice(0, 10);
    const id = today; // utiliser la date comme id

    const existingIndex = historicPrices.findIndex(p => p.date === today);
    
    if (existingIndex !== -1) {
      setHistoricPrices(prev => prev.map(p => p.date === today ? { ...p, price: newPrice } : p));
      setPendingPriceChanges(prev => [...prev, { type: 'update', id, date: today, price: newPrice }]);
    } else {
      setHistoricPrices(prev => [{ id, date: today, price: newPrice }, ...prev]);
      setPendingPriceChanges(prev => [...prev, { type: 'add', id, date: today, price: newPrice }]);
    }
    
    setNewPrice(undefined);
    setHasUnsavedPriceChanges(true);
  };

  const handleUpdatePriceEntry = () => {
    if (!editingPriceEntry) return;

    setHistoricPrices(prev => prev.map(p => p.id === editingPriceEntry.id ? editingPriceEntry : p));
    setPendingPriceChanges(prev => [...prev, { type: 'update', id: editingPriceEntry.id, date: editingPriceEntry.date, price: editingPriceEntry.price }]);
    setEditingPriceEntry(null);
    setHasUnsavedPriceChanges(true);
  };

  const handleDeletePriceEntry = (priceId: string) => {
    if (!editingItem) return;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce prix ?`)) return;

    setHistoricPrices(prev => prev.filter(p => p.id !== priceId));
    setPendingPriceChanges(prev => [...prev, { type: 'delete', id: priceId, date: priceId }]);
    setHasUnsavedPriceChanges(true);
  };

  const handleSavePriceChanges = async () => {
    if (!editingItem || pendingPriceChanges.length === 0) return;
    setActionLoading(true);
    try {
      const changesMap = new Map<string, PriceChange>();
      pendingPriceChanges.forEach(change => {
        changesMap.set(change.id, change);
      });

      for (const [_, change] of changesMap) {
        const priceDocRef = doc(db, `items/${editingItem.id}/prices`, change.id);
        if (change.type === 'delete') {
          await deleteDoc(priceDocRef);
        } else if (change.type === 'add' || change.type === 'update') {
          await setDoc(priceDocRef, { date: change.date, price: Number(change.price) });
        }
      }

      await fetchHistoricPrices(editingItem.id);
    } catch (err) {
      console.error("Erreur enregistrement prix:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // --- DELETE ITEM ---
  const handleDelete = async () => {
    if (!deletingItem) return;
    setActionLoading(true);
    try {
      await deleteDoc(doc(db, "items", deletingItem.id));
      setItems((prev) => prev.filter((item) => item.id !== deletingItem.id));
      setDeletingItem(null);
    } catch (err) {
      console.error("Erreur delete:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // --- SORTING & FILTERING ---
  const processedItems = useMemo(() => {
    let data = [...items];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerTerm) ||
          item.bloc.toLowerCase().includes(lowerTerm) ||
          item.type.toLowerCase().includes(lowerTerm)
      );
    }

    if (sortConfig) {
      data.sort((a, b) => {
        const key = sortConfig.key;
        const aValue = a[key] ?? (typeof a[key] === 'number' ? 0 : '');
        const bValue = b[key] ?? (typeof b[key] === 'number' ? 0 : '');
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
        }
        
        return sortConfig.direction === "asc"
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }
    return data;
  }, [items, searchTerm, sortConfig]);

  const requestSort = (key: keyof Item) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <ProtectedPage>
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion du Catalogue</h1>
            <p className="text-muted-foreground">Administration complète des items.</p>
        </div>
      </div>

      {/* --- SECTION AJOUT --- */}
      <Card className="border-dashed border-2 bg-muted/20">
        <CardHeader>
          <CardTitle className="text-lg">Ajouter un nouvel item</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-1 lg:col-span-2">
                    <Label>Nom *</Label>
                    <Input value={createForm.name} onChange={(e) => handleCreateChange("name", e.target.value)} placeholder="Nom de l'item" />
                </div>
                <div className="space-y-1">
                    <Label>Type *</Label>
                    <Input value={createForm.type} onChange={(e) => handleCreateChange("type", e.target.value)} placeholder="ETB, Booster..." />
                </div>
                <div className="space-y-1">
                    <Label>Bloc *</Label>
                    <Input value={createForm.bloc} onChange={(e) => handleCreateChange("bloc", e.target.value)} placeholder="Nom du bloc" />
                </div>
                <div className="space-y-1">
                    <Label>Date de sortie *</Label>
                    <Input type="date" value={createForm.releaseDate} onChange={(e) => handleCreateChange("releaseDate", e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label>Prix Retail (€)</Label>
                    <Input type="number" value={createForm.retailPrice} onChange={(e) => handleCreateChange("retailPrice", Number(e.target.value))} />
                </div>
                 <div className="space-y-1">
                    <Label>Prix Initial (Historique)</Label>
                    <Input type="number" value={createForm.initialPrice ?? ""} onChange={(e) => handleCreateChange("initialPrice", Number(e.target.value))} />
                </div>
                 <div className="space-y-1 lg:col-span-2">
                    <Label>URL Cardmarket</Label>
                    <Input value={createForm.cardmarketUrl || ""} onChange={(e) => handleCreateChange("cardmarketUrl", e.target.value)} placeholder="https://..." />
                </div>
                <div className="space-y-1 lg:col-span-3">
                    <Label>Image URL</Label>
                    <Input value={createForm.image || ""} onChange={(e) => handleCreateChange("image", e.target.value)} placeholder="https://..." />
                </div>
                 <div className="space-y-1 lg:col-span-1">
                     <Button onClick={handleCreate} disabled={actionLoading || !createForm.name || !createForm.bloc || !createForm.type} className="w-full">
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer"}
                     </Button>
                 </div>
            </div>
        </CardContent>
      </Card>

      {/* --- TABLEAU PRINCIPAL --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle>Base de données</CardTitle>
            <CardDescription>{items.length} items trouvés</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Rechercher..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => requestSort("name")}>Nom <ArrowUpDown className="inline ml-1 h-3 w-3" /></TableHead>
                    <TableHead className="cursor-pointer" onClick={() => requestSort("type")}>Type <ArrowUpDown className="inline ml-1 h-3 w-3" /></TableHead>
                    <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => requestSort("bloc")}>Bloc <ArrowUpDown className="inline ml-1 h-3 w-3" /></TableHead>
                    <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => requestSort("releaseDate")}>Sortie <ArrowUpDown className="inline ml-1 h-3 w-3" /></TableHead>
                    <TableHead className="cursor-pointer" onClick={() => requestSort("retailPrice")}>Prix <ArrowUpDown className="inline ml-1 h-3 w-3" /></TableHead>
                    <TableHead className="w-[50px]">CM</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedItems.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="h-24 text-center">Aucun résultat.</TableCell></TableRow>
                  ) : (
                      processedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.image ? (
                                <img src={item.image} alt="img" className="h-10 w-10 object-cover rounded-md bg-muted" />
                            ) : (<div className="h-10 w-10 bg-muted rounded-md flex items-center justify-center text-xs">N/A</div>)}
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate" title={item.name}>{item.name}</TableCell>
                          <TableCell><span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">{item.type}</span></TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{item.bloc}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{item.releaseDate}</TableCell>
                          <TableCell>{item.retailPrice} €</TableCell>
                          <TableCell>
                            {item.cardmarketUrl && (
                                <a href={item.cardmarketUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => {
                                        setEditingItem(item);
                                        fetchHistoricPrices(item.id);
                                    }}>
                                    <Pencil className="h-4 w-4" />
                                </Button>                                
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingItem(item)}><Trash2 className="h-4 w-4" /></Button>
                             </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- EDIT DIALOG (ITEM ET PRIX HISTORIQUE) --- */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && handleEditDialogChange(false)}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Modifier l'item: {editingItem?.name}</DialogTitle>
          </DialogHeader>
          {editingItem && (
             <div className="grid gap-6 py-4">
                {/* 1. CHAMPS PRINCIPAUX */}
                <h3 className="text-lg font-semibold border-b pb-1">Détails Principaux</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <Label>Type</Label>
                        <Input value={editingItem.type} onChange={(e) => setEditingItem({...editingItem, type: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <Label>Bloc</Label>
                        <Input value={editingItem.bloc} onChange={(e) => setEditingItem({...editingItem, bloc: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <Label>Date de sortie</Label>
                        <Input type="date" value={editingItem.releaseDate} onChange={(e) => setEditingItem({...editingItem, releaseDate: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <Label>Prix Retail (€)</Label>
                        <Input type="number" value={editingItem.retailPrice} onChange={(e) => setEditingItem({...editingItem, retailPrice: Number(e.target.value)})} />
                    </div>
                    <div className="col-span-2 space-y-1">
                        <Label>URL Cardmarket</Label>
                        <Input value={editingItem.cardmarketUrl || ""} onChange={(e) => setEditingItem({...editingItem, cardmarketUrl: e.target.value})} />
                    </div>
                    <div className="col-span-3 space-y-1">
                        <Label>Image URL</Label>
                        <Input value={editingItem.image || ""} onChange={(e) => setEditingItem({...editingItem, image: e.target.value})} />
                    </div>
                </div>

                <Separator />
                
                {/* 2. GESTION DES PRIX HISTORIQUES */}
                <div className="flex justify-between items-center border-b pb-1">
                    <h3 className="text-lg font-semibold">
                        Historique des Prix ({historicPrices.length} entrées)
                        {pricesLoading && <Loader2 className="inline ml-2 w-4 h-4 animate-spin text-primary" />}
                    </h3>
                    {hasUnsavedPriceChanges && (
                        <span className="text-sm text-orange-600 font-medium">
                            {pendingPriceChanges.length} modification(s) en attente
                        </span>
                    )}
                </div>

                {/* Ajout d'un nouveau prix */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-1 col-span-3">
                        <Label>Nouveau Prix (€) pour aujourd'hui ({new Date().toISOString().slice(0, 10)})</Label>
                        <Input 
                            type="number" 
                            placeholder="Prix actuel du marché"
                            value={newPrice ?? ""} 
                            onChange={(e) => setNewPrice(Number(e.target.value))} 
                        />
                    </div>
                    <div className="flex items-end">
                        <Button 
                            onClick={handleAddNewPrice} 
                            disabled={newPrice === undefined || isNaN(newPrice) || newPrice <= 0}
                            variant="outline"
                            className="w-full"
                        >
                            Ajouter
                        </Button>
                    </div>
                </div>
                
                {/* Tableau des prix historiques */}
                <div className="border rounded-md max-h-60 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-1/3">Date</TableHead>
                                <TableHead className="w-1/3">Prix (€)</TableHead>
                                <TableHead className="w-1/3 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {historicPrices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">Aucun historique de prix</TableCell>
                                </TableRow>
                            ) : (
                                historicPrices.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="font-medium">{entry.date}</TableCell>
                                        <TableCell>{entry.price} €</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => setEditingPriceEntry(entry)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeletePriceEntry(entry.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

             </div>
          )}
          <DialogFooter className="flex justify-between items-center">
             <Button variant="outline" onClick={() => handleEditDialogChange(false)}>Fermer</Button>
             <div className="flex gap-2">
                <Button onClick={handleUpdate} disabled={actionLoading} variant="secondary">
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer Détails
                </Button>
                <Button 
                    onClick={handleSavePriceChanges} 
                    disabled={actionLoading || !hasUnsavedPriceChanges}
                    className="bg-green-600 hover:bg-green-700"
                >
                    {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Valider Prix ({pendingPriceChanges.length})
                </Button>
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* --- MODALE D'ÉDITION D'UN PRIX HISTORIQUE SPÉCIFIQUE --- */}
      <Dialog open={!!editingPriceEntry} onOpenChange={(open) => !open && setEditingPriceEntry(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier le Prix du {editingPriceEntry?.date}</DialogTitle>
            </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label>Nouveau Prix (€)</Label>
              <Input
                type="number"
                value={editingPriceEntry?.price ?? 0}
                onChange={(e) =>
                  setEditingPriceEntry({
                    ...editingPriceEntry!,
                    price: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingPriceEntry(null)}
              disabled={actionLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdatePriceEntry}
              disabled={
                actionLoading ||
                !editingPriceEntry ||
                isNaN(editingPriceEntry.price)
              }
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Enregistrer Prix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* --- ALERT DIALOG SUPPRESSION ITEM --- */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'item</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'item "{deletingItem?.name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
    </ProtectedPage>
  );
}
