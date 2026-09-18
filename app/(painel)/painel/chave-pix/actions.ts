"use server";

import { revalidatePath } from "next/cache";
import { salvarChavePix } from "@/lib/igreja/chave-pix";

export async function atualizarChavePixAction(formData: FormData) {
  const chave = String(formData.get("chave_pix") ?? "");
  const resultado = await salvarChavePix(chave);
  if (resultado.ok) {
    revalidatePath("/painel/encontro");
    revalidatePath("/painel/legado");
    revalidatePath("/painel/inscricoes-eventos");
    revalidatePath("/encontro-com-deus");
    revalidatePath("/legado-de-cristo");
    revalidatePath("/eventos");
  }
  return resultado;
}
