"use client";

import { useState } from "react";
import { sendSignInLinkToEmail, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowRight, CheckCircle, AlertCircle, UserPlus } from "lucide-react";
import { getUserSubscription, hasProAccess } from "@/lib/subscription";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // --- LOGIN PAR EMAIL ---
  const sendLink = async () => {
    if (!email) return setError("Veuillez entrer votre adresse email");
    if (!isValidEmail(email)) return setError("Veuillez entrer une adresse email valide");

    setLoadingEmail(true);
    setError("");

    const actionCodeSettings = {
      url: `${window.location.origin}/login/confirm`,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email);
      setSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de l'envoi du lien");
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loadingEmail) sendLink();
  };

  // --- LOGIN PAR GOOGLE ---
  const signInWithGoogle = async () => {
    setLoadingGoogle(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("Utilisateur Google:", user);
      const subscription = await getUserSubscription(user.uid);
      const tokenResult = await user.getIdTokenResult(true);
      const isAdmin = tokenResult?.claims?.admin === true;
      const isPro = hasProAccess(subscription) || isAdmin;
      window.location.href = isPro ? "/analyse" : "/pricing";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erreur lors de la connexion avec Google");
    } finally {
      setLoadingGoogle(false);
    }
  };

  // --- RENDER EMAIL SENT ---
  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <CardTitle className="text-2xl">Email envoyé !</CardTitle>
            <CardDescription>Un lien de connexion a été envoyé à <b>{email}</b></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-primary/5 border-primary/20">
              <Mail className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Vérifiez votre boîte de réception. Le lien expirera dans 60 minutes.
              </AlertDescription>
            </Alert>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => { setSent(false); setEmail(""); }}
            >
              Renvoyer à une autre adresse
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- RENDER LOGIN PAGE ---
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full space-y-6">
        <CardHeader className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Connexion / Inscription</CardTitle>
          <CardDescription>Accès aux prix en 1 clic</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground">Ce que vous débloquez :</p>
            <ul className="space-y-1">
              <li>• Quota quotidien de recherches</li>
              <li>• Historique des prix par série</li>
              <li>• Alertes et widgets avancés (Pro)</li>
            </ul>
          </div>

          {/* EMAIL */}
          <div className="space-y-2">
            <Label htmlFor="email">Connexion par email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemple.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyPress={handleKeyPress}
              disabled={loadingEmail}
            />
            <Button onClick={sendLink} disabled={loadingEmail || !email} className="w-full mt-2">
              {loadingEmail ? "Envoi en cours..." : "Recevoir le lien"}
            </Button>
          </div>

          {/* Google */}
          <div className="pt-4 border-t border-muted-foreground/20">
            <Button onClick={signInWithGoogle} disabled={loadingGoogle} className="w-full mt-2">
              {loadingGoogle ? (
                "Connexion en cours..."
              ) : (
                <>
                  <Image src="/logo/logo_google.png" alt="" width={18} height={18} />
                  Se connecter avec Google
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
