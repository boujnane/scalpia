"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import type { SubscriptionTier } from "@/lib/subscription";
import { Shield, Users, Crown, Trash2, Plus, Loader2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type SubscriptionDoc = {
  id: string;
  tier: SubscriptionTier; // "free" | "pro" | "admin"
  createdAt: Date | null;
  expiresAt: Date | null;
};

function parseFirestoreDate(val: unknown): Date | null {
  if (!val) return null;

  // Firestore Timestamp (client SDK)
  if (val instanceof Timestamp) return val.toDate();

  // Timestamp-like object (has toDate)
  if (typeof val === "object" && val !== null && "toDate" in val && typeof (val as any).toDate === "function") {
    try {
      return (val as any).toDate();
    } catch {
      return null;
    }
  }

  // Native Date
  if (val instanceof Date) return val;

  // ISO string / millis
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function formatFR(d: Date | null): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const myUid = user?.uid ?? null;

  const [subscriptions, setSubscriptions] = useState<SubscriptionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserId, setNewUserId] = useState("");
  const [newTier, setNewTier] = useState<Exclude<SubscriptionTier, "admin">>("pro"); // admin interdit
  const [saving, setSaving] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/");
  }, [authLoading, isAdmin, router]);

  const fetchSubscriptions = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "subscriptions"));

      const subs: SubscriptionDoc[] = snapshot.docs.map((d) => {
        const data = d.data() as any;

        return {
          id: d.id,
          tier: (data.tier as SubscriptionTier) || "free",
          createdAt: parseFirestoreDate(data.createdAt),
          expiresAt: parseFirestoreDate(data.expiresAt),
        };
      });

      // Tri (pro en haut, puis free)
      subs.sort((a, b) => {
        const rank = (t: SubscriptionTier) => (t === "pro" ? 0 : t === "free" ? 1 : 2);
        const r = rank(a.tier) - rank(b.tier);
        if (r !== 0) return r;
        return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
      });

      setSubscriptions(subs);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchSubscriptions();
  }, [isAdmin, fetchSubscriptions]);

  const stats = useMemo(() => {
    const total = subscriptions.length;
    const pro = subscriptions.filter((s) => s.tier === "pro").length;
    const free = subscriptions.filter((s) => s.tier === "free").length;
    return { total, pro, free };
  }, [subscriptions]);

  const tierBadge = (tier: SubscriptionTier) => {
    switch (tier) {
      case "pro":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Pro</Badge>;
      case "admin":
        return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">Admin</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const canEdit = (uid: string, tier: SubscriptionTier) => {
    // toi: jamais modifiable
    if (myUid && uid === myUid) return false;
    // un doc admin: jamais modifiable (il n’y en a qu’un = toi, mais au cas où)
    if (tier === "admin") return false;
    return true;
  };

  const handleAddSubscription = async () => {
    const uid = newUserId.trim();
    if (!uid) return;
    if (myUid && uid === myUid) {
      alert("Tu ne peux pas modifier ton propre compte via cette interface.");
      return;
    }

    setSaving(true);
    try {
      await setDoc(
        doc(db, "subscriptions", uid),
        {
          tier: newTier,
          expiresAt: null,
          // ✅ timestamps serveur (si autorisés par tes rules)
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setNewUserId("");
      await fetchSubscriptions();
    } catch (err) {
      console.error("Error adding subscription:", err);
      alert("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTier = async (uid: string, tier: Exclude<SubscriptionTier, "admin">) => {
    const current = subscriptions.find((s) => s.id === uid);
    if (!current) return;

    if (!canEdit(uid, current.tier)) return;

    try {
      await setDoc(
        doc(db, "subscriptions", uid),
        { tier, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await fetchSubscriptions();
    } catch (err) {
      console.error("Error updating subscription:", err);
      alert("Erreur lors de la modification");
    }
  };

  const handleDelete = async (uid: string) => {
    const current = subscriptions.find((s) => s.id === uid);
    if (!current) return;

    if (!canEdit(uid, current.tier)) return;

    if (!confirm(`Supprimer l'abonnement de ${uid} ?`)) return;

    try {
      await deleteDoc(doc(db, "subscriptions", uid));
      await fetchSubscriptions();
    } catch (err) {
      console.error("Error deleting subscription:", err);
      alert("Erreur lors de la suppression");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Administration</h1>
            <p className="text-sm text-muted-foreground">Gestion des abonnements</p>
          </div>
        </div>

        <Button variant="outline" onClick={fetchSubscriptions}>
          Rafraîchir
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Crown className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold text-primary">{stats.pro}</p>
            <p className="text-sm text-muted-foreground">Pro</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-3xl font-bold text-muted-foreground">{stats.free}</p>
            <p className="text-sm text-muted-foreground">Free</p>
          </CardContent>
        </Card>
      </div>

      {/* Add new subscription */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Ajouter / modifier un abonnement</CardTitle>
          <CardDescription>Entrez l'UID Firebase (admin non modifiable)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="User ID (Firebase UID)"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              className="flex-1"
            />

            <Select value={newTier} onValueChange={(v) => setNewTier(v as any)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleAddSubscription} disabled={saving || !newUserId.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Appliquer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Abonnements</CardTitle>
        </CardHeader>

        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun abonnement</p>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => {
                const locked = !canEdit(sub.id, sub.tier);
                const isYou = myUid && sub.id === myUid;

                return (
                  <div
                    key={sub.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {tierBadge(sub.tier)}
                      <span className="font-mono text-sm">{sub.id}</span>
                      {isYou && <Badge variant="outline" className="text-[10px]">Vous</Badge>}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mr-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        <span>
                          Créé : {formatFR(sub.createdAt)} · Expire : {sub.expiresAt ? formatFR(sub.expiresAt) : "∞"}
                        </span>
                      </div>

                      <Select
                        value={sub.tier === "admin" ? "pro" : sub.tier} // affichage safe
                        onValueChange={(v) => handleUpdateTier(sub.id, v as any)}
                        disabled={locked}
                      >
                        <SelectTrigger className="w-full sm:w-24 h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(sub.id)}
                        disabled={locked}
                        title={locked ? "Compte protégé" : "Supprimer"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 p-4 rounded-lg bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">
          Connecté en tant que : <span className="font-mono">{myUid}</span>
        </p>
      </div>
    </div>
  );
}
