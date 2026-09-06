"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function redefinirSenha(formData: FormData) {
  const senha = formData.get("senha") as string;
  const confirmarSenha = formData.get("confirmarSenha") as string;

  if (senha !== confirmarSenha) {
    redirect("/redefinir-senha?erro=senha_diferente");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) {
    redirect("/redefinir-senha?erro=link_invalido");
  }

  redirect("/login?senha_redefinida=1");
}