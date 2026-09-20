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
import {
  analisarLinkVideo,
  baixarPreviaParaStorage,
  obterPreviaDoLink,
} from "@/lib/testemunho-previa";
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
  if (
    error.code === "42501" ||
    /row-level security|permission denied/i.test(msg)
  ) {
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

async function resolverPrevia(
  supabase: SupabaseClient,
  videoUrl: string,
  arquivo: FormDataEntryValue | null
): Promise<{ caminho: string } | { erro: string }> {
  const temArquivo = arquivo instanceof File && arquivo.size > 0;
  if (temArquivo) {
    return enviarPrevia(supabase, arquivo);
  }

  const analise = analisarLinkVideo(videoUrl);
  if (analise?.plataforma === "instagram") {
    return {
      erro:
        "Link do Instagram: envie a prévia (foto ou MP4). Não buscamos automática.",
    };
  }

  const remota = await obterPreviaDoLink(videoUrl);
  if (!remota.ok) return { erro: remota.erro };
  return baixarPreviaParaStorage(supabase, remota.thumbnailUrl);
}

export async function criarTestemunho(formData: FormData) {
  try {
    const perfil = await obterPerfilAtual();
    if (!podeGerenciarMidia(perfil) || !perfil) {
      return { erro: "Sem permissão." };
    }

    const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);
    const descricao = String(formData.get("descricao") ?? "")
      .trim()
      .slice(0, MAX_DESCRICAO_TESTEMUNHO);
    const videoUrl = destinoDoTestemunho(
      String(formData.get("video_url") ?? "")
    );

    if (!nome) return { erro: "Escreva o nome de quem testemunha." };
    if (!descricao) return { erro: "Escreva a descrição do testemunho." };
    if (!videoUrl) {
      return { erro: "Cole o link do Instagram ou do YouTube." };
    }

    const supabase = await createClient();
    const { count } = await supabase
      .from("testemunhos")
      .select("id", { count: "exact", head: true });

    if ((count ?? 0) >= MAX_TESTEMUNHOS) {
      return {
        erro: `Só cabem ${MAX_TESTEMUNHOS} vídeos. Remova um para colocar outro.`,
      };
    }

    const previa = await resolverPrevia(
      supabase,
      videoUrl,
      formData.get("previa")
    );
    if ("erro" in previa) return { erro: previa.erro };
    const caminho = previa.caminho;

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
  } catch (erro) {
    console.error("criarTestemunho", erro);
    return {
      erro:
        "Deu erro ao publicar. Confira o link e a prévia e tente de novo.",
    };
  }
}

export async function editarTestemunho(formData: FormData) {
  try {
    const perfil = await obterPerfilAtual();
    if (!podeGerenciarMidia(perfil) || !perfil) {
      return { erro: "Sem permissão." };
    }

    const id = String(formData.get("id") ?? "");
    if (!uuidValido(id)) return { erro: "Testemunho inválido." };

    const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);
    const descricao = String(formData.get("descricao") ?? "")
      .trim()
      .slice(0, MAX_DESCRICAO_TESTEMUNHO);
    const videoUrl = destinoDoTestemunho(
      String(formData.get("video_url") ?? "")
    );
    const arquivo = formData.get("previa");
    const temArquivo = arquivo instanceof File && arquivo.size > 0;

    if (!nome) return { erro: "Escreva o nome de quem testemunha." };
    if (!descricao) return { erro: "Escreva a descrição do testemunho." };
    if (!videoUrl) {
      return { erro: "Cole o link do Instagram ou do YouTube." };
    }

    const supabase = await createClient();
    const { data: atual, error: erroLeitura } = await supabase
      .from("testemunhos")
      .select("previa_path")
      .eq("id", id)
      .single();

    if (erroLeitura || !atual) {
      return { erro: "Não achei esse testemunho." };
    }

    let caminho = atual.previa_path as string | null;
    let caminhoNovo: string | undefined;

    if (temArquivo) {
      const upload = await enviarPrevia(supabase, arquivo);
      if ("erro" in upload && upload.erro) return { erro: upload.erro };
      caminhoNovo = upload.caminho!;
      caminho = caminhoNovo;
    } else if (!caminho) {
      // Sem prévia antiga e sem arquivo: tenta Shorts; Instagram exige arquivo
      const resolvida = await resolverPrevia(supabase, videoUrl, null);
      if ("erro" in resolvida) return { erro: resolvida.erro };
      caminhoNovo = resolvida.caminho;
      caminho = caminhoNovo;
    }

    const { error } = await supabase
      .from("testemunhos")
      .update({
        nome,
        titulo: nome,
        descricao,
        video_url: videoUrl,
        previa_path: caminho,
      })
      .eq("id", id);

    if (error) {
      if (caminhoNovo) {
        await supabase.storage.from(BUCKET_TESTEMUNHOS).remove([caminhoNovo]);
      }
      return { erro: mensagemErroBanco(error, "atualizar") };
    }

    if (caminhoNovo && atual.previa_path && atual.previa_path !== caminhoNovo) {
      await supabase.storage
        .from(BUCKET_TESTEMUNHOS)
        .remove([atual.previa_path]);
    }

    revalidar();
    return { ok: true };
  } catch (erro) {
    console.error("editarTestemunho", erro);
    return {
      erro: "Deu erro ao salvar a edição. Tente de novo.",
    };
  }
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
