"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Alguns links antigos do Supabase trazem o token no #hash, que o servidor
 * não vê. O cliente do SSR detecta isso, grava o cookie e recarrega a página.
 */
export function CapturarSessaoHash() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.hash.includes("access_token")) return;

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (
        sessao &&
        (evento === "INITIAL_SESSION" ||
          evento === "SIGNED_IN" ||
          evento === "PASSWORD_RECOVERY")
      ) {
        window.history.replaceState(null, "", window.location.pathname);
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
