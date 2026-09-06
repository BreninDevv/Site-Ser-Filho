"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { exigeAdminUsuarios } from "@/lib/auth/permissoes";

export async function promoverParaLider(userId: string) {
  if (!(await exigeAdminUsuarios())) return;

  const supabase = await createClient();
  await supabase.from("perfis").update({ role: "lider" }).eq("id", userId);
  revalidatePath("/painel/admin/usuarios");
}

export async function rebaixarParaPendente(userId: string) {
  if (!(await exigeAdminUsuarios())) return;

  const supabase = await createClient();
  await supabase.from("perfis").update({ role: "pendente" }).eq("id", userId);
  revalidatePath("/painel/admin/usuarios");
}