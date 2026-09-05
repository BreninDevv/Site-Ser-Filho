"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function VerifiqueEmailPage() {
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
    <div className="max-w-sm mx-auto mt-20 px-4 text-center">
      <h1 className="text-2xl font-semibold mb-4">Quase lá!</h1>
      <p className="text-sm text-gray-600 mb-2">
        Enviamos um link de confirmação para <strong>{email || "o seu e-mail"}</strong>.
      </p>
      <p className="text-sm text-gray-600 mb-6">
        Clique nesse link (confira o spam se não aparecer). Esta página avança
        sozinha assim que detectar a confirmação — não precisa recarregar.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <span className="animate-pulse">●</span> Aguardando confirmação...
      </div>
      {erroPolling && (
        <p className="text-sm text-red-600 mt-4">
          Não consegui verificar automaticamente. Assim que confirmar, acesse{" "}
          <a href="/login" className="underline">a tela de login</a> manualmente.
        </p>
      )}
    </div>
  );
}