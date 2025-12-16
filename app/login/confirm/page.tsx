"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { signOut } from "firebase/auth";
import { ALLOWED_EMAIL } from "@/lib/authConfig";

export default function ConfirmLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const confirmLogin = async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) {
        setError("Lien de connexion invalide");
        return;
      }

      let email = window.localStorage.getItem("emailForSignIn");

      if (!email) {
        email = window.prompt("Veuillez confirmer votre adresse email") ?? "";
      }

      try {
        const result = await signInWithEmailLink(
          auth,
          email,
          window.location.href
        );
      
        if (result.user.email !== ALLOWED_EMAIL) {
          await signOut(auth);
          setError("Cet email n’est pas autorisé");
          return;
        }
      
        window.localStorage.removeItem("emailForSignIn");
        router.replace("/insert-db");
      } catch (err) {
        console.error(err);
        setError("Lien expiré ou déjà utilisé");
      }      
    };

    confirmLogin();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Erreur de connexion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-10 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Connexion en cours...</p>
        </CardContent>
      </Card>
    </div>
  );
}
