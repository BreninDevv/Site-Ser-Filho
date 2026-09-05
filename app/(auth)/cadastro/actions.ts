"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function cadastrar(formData: FormData) {
  const senha = formData.get("senha") as string;
  const confirmarSenha = formData.get("confirmarSenha") as string;
  const email = formData.get("email") as string;

  if (senha !== confirmarSenha) {
    redirect("/cadastro?erro=senha_diferente");
  }

  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome: formData.get("nome") as string },
      emailRedirectTo: `${origin}/email-confirmado`,
    },
  });

  if (error) {
    redirect("/cadastro?erro=cadastro_falhou");
  }

  redirect(`/cadastro/verifique-email?email=${encodeURIComponent(email)}`);
}