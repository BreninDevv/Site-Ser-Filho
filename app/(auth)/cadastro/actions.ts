"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  dentroDoLimite,
  emailValido,
  ipDoPedido,
  origemDoSite,
  senhaForte,
} from "@/lib/seguranca";

export async function cadastrar(formData: FormData) {
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);

  if (!emailValido(email) || nome.length < 2) {
    redirect("/cadastro?erro=cadastro_falhou");
  }

  if (!senhaForte(senha)) {
    redirect("/cadastro?erro=senha_fraca");
  }

  if (senha !== confirmarSenha) {
    redirect("/cadastro?erro=senha_diferente");
  }

  const ip = await ipDoPedido();
  if (!dentroDoLimite(`cadastro:${ip}`, 8, 15 * 60 * 1000)) {
    redirect("/cadastro?erro=cadastro_falhou");
  }

  const supabase = await createClient();
  const origin = await origemDoSite();

  const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome },
      emailRedirectTo: `${origin}/auth/confirmar-email`,
    },
  });

  if (error) {
    redirect("/cadastro?erro=cadastro_falhou");
  }

  redirect(`/cadastro/verifique-email?email=${encodeURIComponent(email)}`);
}
