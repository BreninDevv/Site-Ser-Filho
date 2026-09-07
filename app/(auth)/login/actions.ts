"use server";

import { createClient } from "@/lib/supabase/server";
import { destinoAposLogin } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { dentroDoLimite, emailValido, ipDoPedido } from "@/lib/seguranca";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!emailValido(email) || !senha) {
    redirect("/login?erro=credenciais");
  }

  const ip = await ipDoPedido();
  if (!dentroDoLimite(`login:${ip}`, 20, 15 * 60 * 1000)) {
    redirect("/login?erro=credenciais");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      redirect("/login?erro=email_nao_confirmado");
    }
    redirect("/login?erro=credenciais");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?erro=credenciais");

  const { data: perfil } = await supabase
    .from("perfis")
    .select("role")
    .eq("id", user.id)
    .single();

  redirect(destinoAposLogin(perfil?.role));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
