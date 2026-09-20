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

function caminhoPreviaSeguro(path: string | null | undefined) {
  const limpo = String(path ?? "").trim();
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|mp4|webm)$/i.test(
      limpo
    )
  ) {
    return null;
  }
  return limpo;
}

async function resolverPreviaSemArquivo(
  supabase: SupabaseClient,
  videoUrl: string
): Promise<{ caminho: string } | { erro: string }> {
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
    const previaPath = caminhoPreviaSeguro(
      String(formData.get("previa_path") ?? "")
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

    let caminho = previaPath;
    if (!caminho) {
      const resolvida = await resolverPreviaSemArquivo(supabase, videoUrl);
      if ("erro" in resolvida) return { erro: resolvida.erro };
      caminho = resolvida.caminho;
    }

    const { error } = await supabase.from("testemunhos").insert({
      nome,
      titulo: nome,
      descricao,
      video_url: videoUrl,
      previa_path: caminho,
      autor_id: perfil.id,
    });

    if (error) {
      // Não apaga upload do cliente em falha de insert — pode reusar na edição;
      // só remove se foi thumbnail baixada no servidor e insert falhou.
      if (!previaPath) {
        await supabase.storage.from(BUCKET_TESTEMUNHOS).remove([caminho]);
      }
      return { erro: mensagemErroBanco(error, "salvar") };
    }

    revalidar();
    return { ok: true };
  } catch (erro) {
    console.error("criarTestemunho", erro);
    return {
      erro:
        "Deu erro ao publicar. Se o vídeo for grande, espere o envio terminar e tente de novo.",
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
    const previaPathNova = caminhoPreviaSeguro(
      String(formData.get("previa_path") ?? "")
    );

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

    let caminho = (atual.previa_path as string | null) ?? null;
    let caminhoNovo: string | undefined;

    if (previaPathNova) {
      caminhoNovo = previaPathNova;
      caminho = previaPathNova;
    } else if (!caminho) {
      const resolvida = await resolverPreviaSemArquivo(supabase, videoUrl);
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
      return { erro: mensagemErroBanco(error, "atualizar") };
    }

    if (
      caminhoNovo &&
      atual.previa_path &&
      atual.previa_path !== caminhoNovo
    ) {
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
  try {
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
  } catch (erro) {
    console.error("excluirTestemunho", erro);
  }
}
