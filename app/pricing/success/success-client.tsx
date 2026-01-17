"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { user, isPro } = useAuth();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/analyse";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      {/* ton JSX inchangé */}
      <h1>Paiement réussi 🎉</h1>
      <p>Redirection dans {countdown}s</p>
      <Link href="/analyse">Continuer</Link>
    </div>
  );
}
