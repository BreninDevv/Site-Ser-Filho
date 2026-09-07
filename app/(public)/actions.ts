"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { destinoAposLogin } from "@/lib/auth/roles";
import { emailValido } from "@/lib/seguranca";

type LoginState = {
  error: string | null;
};

export async function login(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const supabase = await createClient();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!emailValido(email) || !senha) {
    return { error: "E-mail ou senha incorretos" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    return {
      error: "E-mail ou senha incorretos",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "E-mail ou senha incorretos" };

  const { data: perfil } = await supabase
    .from("perfis")
    .select("role")
    .eq("id", user.id)
    .single();

  redirect(destinoAposLogin(perfil?.role));
}
