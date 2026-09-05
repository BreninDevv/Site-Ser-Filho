"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("senha") as string,
  });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      redirect("/login?erro=email_nao_confirmado");
    }
    redirect("/login?erro=credenciais");
  }

  redirect("/painel");
}
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}