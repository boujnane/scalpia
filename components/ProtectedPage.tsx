"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-6">
        <Card className="relative w-full max-w-xl overflow-hidden border-border/60 bg-card/70 shadow-xl backdrop-blur">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-rose-500/10 blur-3xl" />

          <CardHeader className="relative z-10 text-center space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-purple-500/90 to-blue-600/90 ring-4 ring-background/80">
              <Icons.pokeball size={28} color="currentColor" className="text-white" />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">Zone Admin</Badge>
            </div>
            <CardTitle className="text-2xl sm:text-3xl">Accès réservé</CardTitle>
          </CardHeader>

          <CardContent className="relative z-10 space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Cette zone est gardée par le Professeur Chen. Il te manque le badge
              <span className="font-semibold text-foreground"> Maitre Admin</span> pour entrer.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild>
                <Link href="/">Retour à Pokéindex</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/login">Se connecter avec un autre compte</Link>
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="h-4 w-4" />
              Accès réservé aux comptes admin.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
