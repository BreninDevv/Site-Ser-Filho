"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function atualizarCelula(
  id: string,
  dados: {
    nome: string;
    endereco: string;
    dia: string;
    horario: string;
    descricao: string;
    nome_responsavel: string;
    foto_url?: string;
  }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("celulas").update(dados).eq("id", id);

  if (error) {
    redirect(`/celulas/${id}/editar?erro=1`);
  }

  redirect("/celulas");
}

export async function excluirCelula(id: string) {
  const supabase = await createClient();
  await supabase.from("celulas").delete().eq("id", id);
  revalidatePath("/celulas");
}