"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  exigeEquipeMidia,
  obterPerfilAtual,
  podeGerenciarMidia,
} from "@/lib/auth/permissoes";
import {
  BUCKET_TESTEMUNHOS,
  destinoDoTestemunho,
  MAX_DESCRICAO_TESTEMUNHO,
  MAX_TESTEMUNHOS,
  TAMANHO_MAX_PREVIA,
  TIPOS_PREVIA,
} from "@/lib/midia";
import { uuidValido } from "@/lib/seguranca";

function revalidar() {
  revalidatePath("/painel/testemunhos");
  revalidatePath("/inicio");
}

function mensagemErroBanco(
  error: { code?: string; message?: string },
  acao: string
) {
  const msg = error.message ?? "";
  if (error.code === "42501" || /row-level security|permission denied/i.test(msg)) {
    return "O banco recusou a gravação. Rode supabase/migrations/012_testemunhos_politicas.sql no Supabase.";
  }
  if (error.code === "PGRST204" || /could not find/i.test(msg)) {
    return "Falta atualizar o schema. Rode supabase/migrations/012_testemunhos_politicas.sql no Supabase.";
  }
  if (error.code === "23502") {
    return `O banco exige um campo que não veio preenchido. ${msg}`;
  }
  return `Não foi possível ${acao}. ${msg}`;
}

async function enviarPrevia(supabase: SupabaseClient, arquivo: File) {
  if (arquivo.size > TAMANHO_MAX_PREVIA) {
    return { erro: "A prévia pode ter no máximo 12 MB." };
  }
  if (!TIPOS_PREVIA.includes(arquivo.type as (typeof TIPOS_PREVIA)[number])) {
    return { erro: "Use PNG, JPG, WebP, MP4 ou WebM." };
  }

  const extensoes: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  const extensao = extensoes[arquivo.type];
  if (!extensao) return { erro: "Use PNG, JPG, WebP, MP4 ou WebM." };
  const caminho = `${crypto.randomUUID()}.${extensao}`;

  const { error } = await supabase.storage
    .from(BUCKET_TESTEMUNHOS)
    .upload(caminho, arquivo, { contentType: arquivo.type });

  if (error) {
    return { erro: mensagemErroBanco(error, "enviar a prévia") };
  }

  return { caminho };
}

export async function criarTestemunho(formData: FormData) {
  const perfil = await obterPerfilAtual();
  if (!podeGerenciarMidia(perfil) || !perfil) return { erro: "Sem permissão." };

  const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);
  const descricao = String(formData.get("descricao") ?? "")
    .trim()
    .slice(0, MAX_DESCRICAO_TESTEMUNHO);
  const videoUrl = destinoDoTestemunho(
    String(formData.get("video_url") ?? "")
  );
  const arquivo = formData.get("previa");

  if (!nome) return { erro: "Escreva o nome de quem testemunha." };
  if (!descricao) return { erro: "Escreva a descrição do testemunho." };
  if (!videoUrl) {
    return { erro: "Cole o link do Instagram ou do YouTube." };
  }
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Envie a prévia do Reel (foto ou vídeo curto)." };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("testemunhos")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) >= MAX_TESTEMUNHOS) {
    return { erro: "Só cabem 3 vídeos. Remova um para colocar outro." };
  }

  const upload = await enviarPrevia(supabase, arquivo);
  if ("erro" in upload && upload.erro) return { erro: upload.erro };
  const caminho = upload.caminho!;

  const { error } = await supabase.from("testemunhos").insert({
    nome,
    titulo: nome,
    descricao,
    video_url: videoUrl,
    previa_path: caminho,
    autor_id: perfil.id,
  });

  if (error) {
    await supabase.storage.from(BUCKET_TESTEMUNHOS).remove([caminho]);
    return { erro: mensagemErroBanco(error, "salvar") };
  }

  revalidar();
  return { ok: true };
}

export async function excluirTestemunho(id: string) {
  if (!uuidValido(id)) return;
  if (!(await exigeEquipeMidia())) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("testemunhos")
    .select("previa_path")
    .eq("id", id)
    .single();

  await supabase.from("testemunhos").delete().eq("id", id);
  if (data?.previa_path) {
    await supabase.storage.from(BUCKET_TESTEMUNHOS).remove([data.previa_path]);
  }

  revalidar();
}
