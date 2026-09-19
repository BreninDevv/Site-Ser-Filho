"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthBrandShell } from "@/components/auth/auth-brand-shell";

function VerifiqueEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";
  const [erroPolling, setErroPolling] = useState(false);

  useEffect(() => {
    if (!email) return;

    const supabase = createClient();

    const intervalo = setInterval(async () => {
      const { data, error } = await supabase.rpc("email_confirmado", {
        p_email: email,
      });

      if (error) {
        setErroPolling(true);
        return;
      }

      if (data === true) {
        clearInterval(intervalo);
        router.push("/login?confirmado=1");
      }
    }, 4000);

    return () => clearInterval(intervalo);
  }, [email, router]);

  return (
    <AuthBrandShell>
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-semibold">Quase lá!</h1>
        <p className="mb-2 text-sm text-muted-foreground">
          Enviamos um link de confirmação para{" "}
          <strong className="text-foreground">{email || "o seu e-mail"}</strong>.
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          Clique nesse link (confira o spam se não aparecer). Esta página avança
          sozinha assim que detectar a confirmação — não precisa recarregar.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="animate-pulse">●</span> Aguardando confirmação...
        </div>
        {erroPolling && (
          <p className="mt-4 text-sm text-destructive">
            Não consegui verificar automaticamente. Assim que confirmar, acesse{" "}
            <a href="/login" className="underline">
              a tela de login
            </a>{" "}
            manualmente.
          </p>
        )}
      </div>
    </AuthBrandShell>
  );
}

export default function VerifiqueEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifiqueEmailContent />
    </Suspense>
  );
}
