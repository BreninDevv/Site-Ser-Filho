"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function criarCelula(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let fotoUrl: string | null = null;
  const foto = formData.get("foto") as File | null;

  if (foto && foto.size > 0) {
    const extensao = foto.name.split(".").pop();
    const nomeArquivo = `${user.id}/${Date.now()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("celulas-fotos")
      .upload(nomeArquivo, foto);

    if (erroUpload) {
      redirect("/celulas/nova?erro=1");
    }

    const { data: urlData } = supabase.storage
      .from("celulas-fotos")
      .getPublicUrl(nomeArquivo);

    fotoUrl = urlData.publicUrl;
  }

  const { error } = await supabase.from("celulas").insert({
    nome: formData.get("nome") as string,
    endereco: formData.get("endereco") as string,
    dia: formData.get("dia") as string,
    horario: formData.get("horario") as string,
    descricao: formData.get("descricao") as string,
    nome_responsavel: formData.get("nome_responsavel") as string,
    foto_url: fotoUrl,
    lider_id: user.id,
  });

  if (error) {
    redirect("/celulas/nova?erro=1");
  }

  redirect("/celulas");
}