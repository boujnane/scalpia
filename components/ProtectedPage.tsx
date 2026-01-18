"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAllowedAdminEmail } from "@/lib/authConfig";

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (!isAllowedAdminEmail(user.email)) {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || !isAllowedAdminEmail(user.email)) {
    return <p>Chargement…</p>;
  }

  return <>{children}</>;
}
