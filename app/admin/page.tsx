"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { SubscriptionTier } from "@/lib/subscription";
import { Shield, Users, Crown, Trash2, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type SubscriptionDoc = {
  id: string;
  tier: SubscriptionTier;
  createdAt: Date | null;
  expiresAt: Date | null;
};

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [subscriptions, setSubscriptions] = useState<SubscriptionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserId, setNewUserId] = useState("");
  const [newTier, setNewTier] = useState<SubscriptionTier>("pro");
  const [saving, setSaving] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/");
    }
  }, [authLoading, isAdmin, router]);

  // Fetch all subscriptions
  useEffect(() => {
    async function fetchSubscriptions() {
      if (!isAdmin) return;

      try {
        const snapshot = await getDocs(collection(db, "subscriptions"));
        const subs: SubscriptionDoc[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          tier: doc.data().tier || "free",
          createdAt: doc.data().createdAt?.toDate() || null,
          expiresAt: doc.data().expiresAt?.toDate() || null,
        }));
        setSubscriptions(subs);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setLoading(false);
      }
    }

    if (isAdmin) {
      fetchSubscriptions();
    }
  }, [isAdmin]);

  const handleAddSubscription = async () => {
    if (!newUserId.trim()) return;

    setSaving(true);
    try {
      await setDoc(doc(db, "subscriptions", newUserId.trim()), {
        tier: newTier,
        createdAt: new Date(),
        expiresAt: null,
        updatedAt: new Date(),
      });

      setSubscriptions((prev) => [
        ...prev,
        { id: newUserId.trim(), tier: newTier, createdAt: new Date(), expiresAt: null },
      ]);
      setNewUserId("");
    } catch (error) {
      console.error("Error adding subscription:", error);
      alert("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTier = async (userId: string, tier: SubscriptionTier) => {
    try {
      await setDoc(doc(db, "subscriptions", userId), { tier, updatedAt: new Date() }, { merge: true });
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, tier } : s))
      );
    } catch (error) {
      console.error("Error updating subscription:", error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm(`Supprimer l'abonnement de ${userId} ?`)) return;

    try {
      await deleteDoc(doc(db, "subscriptions", userId));
      setSubscriptions((prev) => prev.filter((s) => s.id !== userId));
    } catch (error) {
      console.error("Error deleting subscription:", error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const tierBadge = (tier: SubscriptionTier) => {
    switch (tier) {
      case "admin":
        return <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">Admin</Badge>;
      case "pro":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Pro</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Administration</h1>
          <p className="text-sm text-muted-foreground">Gestion des abonnements</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-3xl font-bold">{subscriptions.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Crown className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold text-primary">
              {subscriptions.filter((s) => s.tier === "pro").length}
            </p>
            <p className="text-sm text-muted-foreground">Pro</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-3xl font-bold text-purple-500">
              {subscriptions.filter((s) => s.tier === "admin").length}
            </p>
            <p className="text-sm text-muted-foreground">Admin</p>
          </CardContent>
        </Card>
      </div>

      {/* Add new subscription */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Ajouter un abonnement</CardTitle>
          <CardDescription>Entrez l'ID utilisateur Firebase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="User ID (Firebase UID)"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              className="flex-1"
            />
            <Select value={newTier} onValueChange={(v) => setNewTier(v as SubscriptionTier)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddSubscription} disabled={saving || !newUserId.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Abonnements actifs</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun abonnement</p>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {tierBadge(sub.tier)}
                    <span className="font-mono text-sm">{sub.id}</span>
                    {sub.id === user?.uid && (
                      <Badge variant="outline" className="text-[10px]">Vous</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={sub.tier}
                      onValueChange={(v) => handleUpdateTier(sub.id, v as SubscriptionTier)}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(sub.id)}
                      disabled={sub.id === user?.uid}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current user info */}
      <div className="mt-8 p-4 rounded-lg bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">
          Connecté en tant que : <span className="font-mono">{user?.uid}</span>
        </p>
      </div>
    </div>
  );
}
