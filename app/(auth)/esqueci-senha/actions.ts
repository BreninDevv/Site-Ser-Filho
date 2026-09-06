"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function solicitarRecuperacao(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/esqueci-senha");
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  // Sempre a mesma URL, sem query string: o allowlist do Supabase é chato
  // com parâmetros. O callback manda para /redefinir-senha depois da troca.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });

  // Sempre a mesma tela, exista o e-mail ou não — não vazamos quem tem conta.
  // Se o redirectTo não estiver no allowlist do Supabase, o e-mail simplesmente
  // não sai; a pessoa precisa cadastrar essa URL no painel.
  redirect("/esqueci-senha/enviado");
}
