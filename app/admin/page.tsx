"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { SubscriptionTier } from "@/lib/subscription";
import {
  Shield,
  Users,
  Crown,
  Loader2,
  CalendarClock,
  Mail,
  RefreshCw,
  Search,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type UserWithSubscription = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string | null;
  lastSignIn: string | null;
  tier: SubscriptionTier;
  subscriptionCreatedAt: string | null;
  subscriptionExpiresAt: string | null;
  stripeCustomerId: string | null;
};

function formatFR(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(d);
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const myUid = user?.uid ?? null;

  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<"all" | SubscriptionTier>("all");

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) router.push("/");
  }, [authLoading, isAdmin, router]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin || !user) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, user]);

  useEffect(() => {
    if (isAdmin && user) fetchUsers();
  }, [isAdmin, user, fetchUsers]);

  const stats = useMemo(() => {
    const total = users.length;
    const admin = users.filter((u) => u.tier === "admin").length;
    const pro = users.filter((u) => u.tier === "pro").length;
    const free = users.filter((u) => u.tier === "free").length;
    return { total, admin, pro, free };
  }, [users]);

  const filteredUsers = useMemo(() => {
    let result = users;

    // Filtre par tier
    if (filterTier !== "all") {
      result = result.filter((u) => u.tier === filterTier);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.email?.toLowerCase().includes(q) ||
          u.displayName?.toLowerCase().includes(q) ||
          u.uid.toLowerCase().includes(q)
      );
    }

    return result;
  }, [users, filterTier, searchQuery]);

  const tierBadge = (tier: SubscriptionTier) => {
    switch (tier) {
      case "pro":
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30">
            Pro
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
            Admin
          </Badge>
        );
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const canEdit = (uid: string, tier: SubscriptionTier) => {
    if (myUid && uid === myUid) return false;
    if (tier === "admin") return false;
    return true;
  };

  const handleUpdateTier = async (
    uid: string,
    newTier: "free" | "pro"
  ) => {
    const targetUser = users.find((u) => u.uid === uid);
    if (!targetUser || !canEdit(uid, targetUser.tier)) return;
    if (!user) return;

    setUpdating(uid);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, tier: newTier }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      // Mise à jour locale optimiste
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, tier: newTier } : u))
      );
    } catch (err) {
      console.error("Error updating tier:", err);
      alert("Erreur lors de la modification");
    } finally {
      setUpdating(null);
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Administration</h1>
            <p className="text-sm text-muted-foreground">
              Gestion des utilisateurs et abonnements
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={fetchUsers} disabled={loading}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Rafraîchir
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card
          className={`cursor-pointer transition-all ${
            filterTier === "all" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setFilterTier("all")}
        >
          <CardContent className="pt-6 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            filterTier === "admin" ? "ring-2 ring-purple-500" : ""
          }`}
          onClick={() => setFilterTier("admin")}
        >
          <CardContent className="pt-6 text-center">
            <Shield className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold text-purple-500">{stats.admin}</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            filterTier === "pro" ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => setFilterTier("pro")}
        >
          <CardContent className="pt-6 text-center">
            <Crown className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-primary">{stats.pro}</p>
            <p className="text-xs text-muted-foreground">Pro</p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            filterTier === "free" ? "ring-2 ring-muted-foreground" : ""
          }`}
          onClick={() => setFilterTier("free")}
        >
          <CardContent className="pt-6 text-center">
            <UserCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold text-muted-foreground">
              {stats.free}
            </p>
            <p className="text-xs text-muted-foreground">Free</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email, nom ou UID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={filterTier}
              onValueChange={(v) => setFilterTier(v as any)}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filtrer par tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Utilisateurs ({filteredUsers.length})</span>
            {filterTier !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterTier("all")}
              >
                Réinitialiser le filtre
              </Button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchQuery ? "Aucun utilisateur trouvé" : "Aucun utilisateur"}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u) => {
                const locked = !canEdit(u.uid, u.tier);
                const isYou = myUid && u.uid === myUid;
                const isUpdating = updating === u.uid;

                return (
                  <div
                    key={u.uid}
                    className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 rounded-xl transition-colors ${
                      isYou
                        ? "bg-primary/5 border border-primary/20"
                        : "bg-muted/30 hover:bg-muted/50"
                    }`}
                  >
                    {/* User info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Avatar */}
                      {u.photoURL ? (
                        <img
                          src={u.photoURL}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <UserCircle className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {tierBadge(u.tier)}
                          {u.displayName && (
                            <span className="font-medium truncate">
                              {u.displayName}
                            </span>
                          )}
                          {isYou && (
                            <Badge
                              variant="outline"
                              className="text-[10px] shrink-0"
                            >
                              Vous
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{u.email || "—"}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span
                            className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[200px]"
                            title={u.uid}
                          >
                            {u.uid}
                          </span>

                          <span className="flex items-center gap-1">
                            <CalendarClock className="w-3 h-3" />
                            Inscrit: {formatDateShort(u.createdAt)}
                          </span>

                          {u.stripeCustomerId && (
                            <span className="text-primary">Stripe ✓</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={u.tier === "admin" ? "admin" : u.tier}
                        onValueChange={(v) =>
                          handleUpdateTier(u.uid, v as "free" | "pro")
                        }
                        disabled={locked || isUpdating}
                      >
                        <SelectTrigger className="w-28 h-9 text-xs">
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          {u.tier === "admin" && (
                            <SelectItem value="admin" disabled>
                              Admin
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 p-4 rounded-lg bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">
          Connecté en tant que : <span className="font-mono">{myUid}</span>
        </p>
      </div>
    </div>
  );
}
