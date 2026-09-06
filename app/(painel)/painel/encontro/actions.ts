"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ehLiderOuDev } from "@/lib/auth/permissoes";
import {
  STATUS_INSCRICAO,
  type StatusInscricao,
} from "@/lib/validations/inscricao-encontro";

export async function definirStatus(id: string, status: StatusInscricao) {
  if (!STATUS_INSCRICAO.includes(status)) return;
  if (!(await ehLiderOuDev())) return;

  const supabase = await createClient();
  await supabase.from("inscricoes_encontro").update({ status }).eq("id", id);

  revalidatePath("/painel/encontro");
}

export async function alternarPresenca(id: string, presente: boolean) {
  if (!(await ehLiderOuDev())) return;

  const supabase = await createClient();
  await supabase.from("inscricoes_encontro").update({ presente }).eq("id", id);

  revalidatePath("/painel/encontro");
}

export async function excluirInscricao(id: string) {
  if (!(await ehLiderOuDev())) return;

  const supabase = await createClient();
  await supabase.from("inscricoes_encontro").delete().eq("id", id);

  revalidatePath("/painel/encontro");
}
