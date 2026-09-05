"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function promoverParaLider(userId: string) {
  const supabase = await createClient();
  await supabase.from("perfis").update({ role: "lider" }).eq("id", userId);
  revalidatePath("/painel/admin/usuarios");
}

export async function rebaixarParaPendente(userId: string) {
  const supabase = await createClient();
  await supabase.from("perfis").update({ role: "pendente" }).eq("id", userId);
  revalidatePath("/painel/admin/usuarios");
}