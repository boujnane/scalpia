"use client";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";
import { Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const sendLink = async () => {
    if (!email) {
      setError("Veuillez entrer votre adresse email");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }

    setLoading(true);
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
      if (err.code === "auth/invalid-email") {
        setError("Adresse email invalide");
      } else if (err.code === "auth/too-many-requests") {
        setError("Trop de tentatives. Veuillez réessayer plus tard");
      } else {
        setError("Erreur lors de l'envoi du lien. Veuillez réessayer");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      sendLink();
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <CardTitle className="text-2xl">Email envoyé !</CardTitle>
              <CardDescription className="mt-2">
                Un lien de connexion a été envoyé à{" "}
                <span className="font-semibold text-foreground">{email}</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-primary/5 border-primary/20">
              <Mail className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <p className="font-medium mb-1">📧 Vérifiez votre boîte de réception</p>
                <p className="text-xs text-muted-foreground">
                  Le lien expirera dans 60 minutes
                </p>
              </AlertDescription>
            </Alert>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              Renvoyer à une autre adresse
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl">Connexion</CardTitle>
            <CardDescription className="mt-2">
              Entrez votre email pour recevoir un lien de connexion
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemple.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className={error ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <Button
            onClick={sendLink}
            disabled={loading || !email}
            className="w-full group"
            size="lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <span>Recevoir le lien</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-2">
            En continuant, vous acceptez nos conditions d'utilisation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}