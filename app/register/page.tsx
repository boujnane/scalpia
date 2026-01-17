"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signInWithGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("Utilisateur Google:", user);

      // Optionnel: vérifier que l'email est autorisé
      // if (user.email !== "ady.boujnane@gmail.com") {
      //   throw new Error("Email non autorisé");
      // }

      // Ici tu peux rediriger vers la page d'accueil ou /pricing
      window.location.href = "/pricing";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la connexion avec Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Créer un compte</CardTitle>
          <CardDescription>Inscrivez-vous avec votre compte Google</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={signInWithGoogle}
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? "Connexion en cours..." : "Se connecter avec Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
