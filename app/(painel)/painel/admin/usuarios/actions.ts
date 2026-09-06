"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  exigeAdminUsuarios,
  obterPerfilAtual,
} from "@/lib/auth/permissoes";
import {
  ROLES_ATRIBUIVEIS,
  type RoleAtribuivel,
} from "@/lib/auth/roles";

export async function definirRole(userId: string, role: RoleAtribuivel) {
  if (!(await exigeAdminUsuarios())) return;
  if (!ROLES_ATRIBUIVEIS.includes(role)) return;

  const eu = await obterPerfilAtual();
  if (!eu || eu.id === userId) return;

  const supabase = await createClient();
  const { data: alvo } = await supabase
    .from("perfis")
    .select("role")
    .eq("id", userId)
    .single();

  if (!alvo || alvo.role === "dev") return;

  await supabase.from("perfis").update({ role }).eq("id", userId);
  revalidatePath("/painel/admin/usuarios");
}
