"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ALLOWED_EMAIL } from "@/lib/authConfig";

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (user.email !== ALLOWED_EMAIL) {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.email !== ALLOWED_EMAIL) {
    return <p>Chargement…</p>;
  }

  return <>{children}</>;
}
