"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { senhaForte } from "@/lib/seguranca";

export async function redefinirSenha(formData: FormData) {
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

  if (!senhaForte(senha)) {
    redirect("/redefinir-senha?erro=senha_fraca");
  }

  if (senha !== confirmarSenha) {
    redirect("/redefinir-senha?erro=senha_diferente");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/redefinir-senha?erro=link_invalido");
  }

  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) {
    redirect("/redefinir-senha?erro=link_invalido");
  }

  await supabase.auth.signOut();
  redirect("/login?senha_redefinida=1");
}
