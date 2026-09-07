"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  dentroDoLimite,
  emailValido,
  ipDoPedido,
  origemDoSite,
} from "@/lib/seguranca";

export async function solicitarRecuperacao(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!emailValido(email)) {
    redirect("/esqueci-senha/enviado");
  }

  const ip = await ipDoPedido();
  if (!dentroDoLimite(`recupera:${ip}`, 5, 15 * 60 * 1000)) {
    redirect("/esqueci-senha/enviado");
  }

  const supabase = await createClient();
  const origin = await origemDoSite();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback`,
  });

  redirect("/esqueci-senha/enviado");
}
