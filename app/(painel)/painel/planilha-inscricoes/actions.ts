"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigeConferirPlanilha } from "@/lib/auth/permissoes";
import { uuidValido } from "@/lib/seguranca";
import type { FontePlanilha } from "./tipos";

export async function marcarChegadaPlanilha(
  fonte: FontePlanilha,
  id: string,
  presente: boolean
) {
  if (!["encontro", "legado", "evento"].includes(fonte)) return;
  if (!uuidValido(id)) return;
  if (!(await exigeConferirPlanilha())) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("marcar_chegada", {
    p_fonte: fonte,
    p_id: id,
    p_presente: presente,
  });

  if (error) {
    console.error("marcar_chegada", error.message);
    return;
  }

  revalidatePath("/painel/planilha-inscricoes");
  revalidatePath("/painel/encontro");
  revalidatePath("/painel/legado");
  revalidatePath("/painel/inscricoes-eventos");
}
