"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigeEquipeMidia } from "@/lib/auth/permissoes";
import {
  BUCKET_EVENTOS,
  TAMANHO_MAX_POST,
  TIPOS_POST,
} from "@/lib/midia";
import { uuidValido } from "@/lib/seguranca";

export async function criarEvento(formData: FormData) {
  if (!(await exigeEquipeMidia())) return { erro: "Sem permissão." };

  const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);
  const arquivo = formData.get("imagem");

  if (!nome) return { erro: "Escreva o nome do evento." };
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Envie a imagem do post." };
  }
  if (arquivo.size > TAMANHO_MAX_POST) {
    return { erro: "A imagem pode ter no máximo 5 MB." };
  }
  if (!TIPOS_POST.includes(arquivo.type as (typeof TIPOS_POST)[number])) {
    return { erro: "Use PNG, JPG ou WebP." };
  }

  const supabase = await createClient();
  const extensoes: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  const extensao = extensoes[arquivo.type];
  if (!extensao) return { erro: "Use PNG, JPG ou WebP." };
  const caminho = `${crypto.randomUUID()}.${extensao}`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_EVENTOS)
    .upload(caminho, arquivo, { contentType: arquivo.type });

  if (erroUpload) {
    return { erro: "Não foi possível enviar a imagem. Rode a migration 005 no Supabase." };
  }

  const { error } = await supabase.from("eventos").insert({ nome, imagem_path: caminho });
  if (error) {
    await supabase.storage.from(BUCKET_EVENTOS).remove([caminho]);
    return { erro: "Não foi possível salvar o evento." };
  }

  revalidatePath("/painel/eventos");
  revalidatePath("/eventos");
  revalidatePath("/inicio");
  return { ok: true };
}

export async function excluirEvento(id: string) {
  if (!uuidValido(id)) return;
  if (!(await exigeEquipeMidia())) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("eventos")
    .select("imagem_path")
    .eq("id", id)
    .single();

  await supabase.from("eventos").delete().eq("id", id);
  if (data?.imagem_path) {
    await supabase.storage.from(BUCKET_EVENTOS).remove([data.imagem_path]);
  }

  revalidatePath("/painel/eventos");
  revalidatePath("/eventos");
  revalidatePath("/inicio");
}
