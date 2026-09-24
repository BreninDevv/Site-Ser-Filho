"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  exigeUnicasMidia,
  obterPerfilAtual,
  podeGerenciarUnicasMidia,
} from "@/lib/auth/permissoes";
import { BUCKET_UNICAS_MIDIA, MAX_MIDIA_UNICAS } from "@/lib/midia";
import { uuidValido } from "@/lib/seguranca";

function revalidar() {
  revalidatePath("/painel/unicas-midia");
  revalidatePath("/unicas");
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
    return "O banco recusou a gravação. Rode supabase/migrations/029_midia_unicas.sql no Supabase.";
  }
  if (error.code === "PGRST204" || /could not find/i.test(msg)) {
    return "Falta atualizar o schema. Rode supabase/migrations/029_midia_unicas.sql no Supabase.";
  }
  return `Não foi possível ${acao}. ${msg}`;
}

function caminhoSeguro(path: string | null | undefined) {
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

function tipoDoArquivo(
  caminho: string,
  informado: string | null | undefined
): "imagem" | "video" {
  if (informado === "video" || informado === "imagem") return informado;
  return /\.(mp4|webm)$/i.test(caminho) ? "video" : "imagem";
}

export async function criarMidiaUnicas(formData: FormData) {
  try {
    const perfil = await obterPerfilAtual();
    if (!podeGerenciarUnicasMidia(perfil) || !perfil) {
      return { erro: "Sem permissão." };
    }

    const titulo = String(formData.get("titulo") ?? "").trim().slice(0, 80);
    const subtitulo = String(formData.get("subtitulo") ?? "")
      .trim()
      .slice(0, 160);
    const arquivoPath = caminhoSeguro(String(formData.get("arquivo_path") ?? ""));
    const tipoInformado = String(formData.get("tipo") ?? "").trim();
    const ordemRaw = Number(formData.get("ordem") ?? 0);
    const ordem = Number.isFinite(ordemRaw)
      ? Math.max(0, Math.min(999, Math.floor(ordemRaw)))
      : 0;

    if (!titulo) return { erro: "Escreva um título para a faixa." };
    if (!arquivoPath) return { erro: "Envie uma foto ou um vídeo." };

    const tipo = tipoDoArquivo(arquivoPath, tipoInformado);
    const supabase = await createClient();

    const { count } = await supabase
      .from("midia_unicas")
      .select("id", { count: "exact", head: true });

    if ((count ?? 0) >= MAX_MIDIA_UNICAS) {
      return {
        erro: `Só cabem ${MAX_MIDIA_UNICAS} itens. Remova um para colocar outro.`,
      };
    }

    const { error } = await supabase.from("midia_unicas").insert({
      titulo,
      subtitulo,
      arquivo_path: arquivoPath,
      tipo,
      ordem,
      criado_por: perfil.id,
    });

    if (error) {
      await supabase.storage.from(BUCKET_UNICAS_MIDIA).remove([arquivoPath]);
      return { erro: mensagemErroBanco(error, "salvar") };
    }

    revalidar();
    return { ok: true };
  } catch (erro) {
    console.error("criarMidiaUnicas", erro);
    return {
      erro:
        "Deu erro ao publicar. Se o arquivo for grande, espere o envio terminar e tente de novo.",
    };
  }
}

export async function editarMidiaUnicas(formData: FormData) {
  try {
    const perfil = await obterPerfilAtual();
    if (!podeGerenciarUnicasMidia(perfil) || !perfil) {
      return { erro: "Sem permissão." };
    }

    const id = String(formData.get("id") ?? "");
    if (!uuidValido(id)) return { erro: "Item inválido." };

    const titulo = String(formData.get("titulo") ?? "").trim().slice(0, 80);
    const subtitulo = String(formData.get("subtitulo") ?? "")
      .trim()
      .slice(0, 160);
    const arquivoPathNovo = caminhoSeguro(
      String(formData.get("arquivo_path") ?? "")
    );
    const tipoInformado = String(formData.get("tipo") ?? "").trim();
    const ordemRaw = Number(formData.get("ordem") ?? 0);
    const ordem = Number.isFinite(ordemRaw)
      ? Math.max(0, Math.min(999, Math.floor(ordemRaw)))
      : 0;

    if (!titulo) return { erro: "Escreva um título para a faixa." };

    const supabase = await createClient();
    const { data: atual, error: erroLeitura } = await supabase
      .from("midia_unicas")
      .select("arquivo_path, tipo")
      .eq("id", id)
      .single();

    if (erroLeitura || !atual) {
      return { erro: "Não achei esse item." };
    }

    let caminho = atual.arquivo_path as string;
    let tipo = (atual.tipo as "imagem" | "video") ?? "imagem";

    if (arquivoPathNovo) {
      caminho = arquivoPathNovo;
      tipo = tipoDoArquivo(arquivoPathNovo, tipoInformado);
    }

    const { error } = await supabase
      .from("midia_unicas")
      .update({
        titulo,
        subtitulo,
        arquivo_path: caminho,
        tipo,
        ordem,
      })
      .eq("id", id);

    if (error) {
      return { erro: mensagemErroBanco(error, "atualizar") };
    }

    if (
      arquivoPathNovo &&
      atual.arquivo_path &&
      atual.arquivo_path !== arquivoPathNovo
    ) {
      await supabase.storage
        .from(BUCKET_UNICAS_MIDIA)
        .remove([atual.arquivo_path]);
    }

    revalidar();
    return { ok: true };
  } catch (erro) {
    console.error("editarMidiaUnicas", erro);
    return { erro: "Deu erro ao salvar a edição. Tente de novo." };
  }
}

export async function excluirMidiaUnicas(id: string) {
  try {
    if (!uuidValido(id)) return;
    if (!(await exigeUnicasMidia())) return;

    const supabase = await createClient();
    const { data } = await supabase
      .from("midia_unicas")
      .select("arquivo_path")
      .eq("id", id)
      .single();

    await supabase.from("midia_unicas").delete().eq("id", id);
    if (data?.arquivo_path) {
      await supabase.storage
        .from(BUCKET_UNICAS_MIDIA)
        .remove([data.arquivo_path]);
    }

    revalidar();
  } catch (erro) {
    console.error("excluirMidiaUnicas", erro);
  }
}
