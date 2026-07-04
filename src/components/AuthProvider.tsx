"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const restoreAuth = useAuthStore((s) => s.restoreAuth);

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  return <>{children}</>;
}
