"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function atualizarCelula(id: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dadosAtualizados: Record<string, unknown> = {
    nome: formData.get("nome") as string,
    endereco: formData.get("endereco") as string,
    dia: formData.get("dia") as string,
    horario: formData.get("horario") as string,
    descricao: formData.get("descricao") as string,
    nome_responsavel: formData.get("nome_responsavel") as string,
  };

  const foto = formData.get("foto") as File | null;

  if (foto && foto.size > 0) {
    const extensao = foto.name.split(".").pop();
    const nomeArquivo = `${user.id}/${Date.now()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("celulas-fotos")
      .upload(nomeArquivo, foto);

    if (erroUpload) {
      redirect(`/celulas/${id}/editar?erro=1`);
    }

    const { data: urlData } = supabase.storage
      .from("celulas-fotos")
      .getPublicUrl(nomeArquivo);

    dadosAtualizados.foto_url = urlData.publicUrl;
  }

  const { error } = await supabase
    .from("celulas")
    .update(dadosAtualizados)
    .eq("id", id);

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