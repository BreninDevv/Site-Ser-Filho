"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigeEquipeMidia } from "@/lib/auth/permissoes";
import {
  BUCKET_EVENTOS,
  MAX_DESCRICAO_EVENTO,
  TAMANHO_MAX_POST,
  TIPOS_POST,
} from "@/lib/midia";
import { uuidValido } from "@/lib/seguranca";
import type { SupabaseClient } from "@supabase/supabase-js";

function revalidar(eventoId?: string) {
  revalidatePath("/painel/eventos");
  revalidatePath("/painel/inscricoes-eventos");
  revalidatePath("/eventos");
  revalidatePath("/eventos/[id]", "page");
  revalidatePath("/inicio");
  if (eventoId) revalidatePath(`/eventos/${eventoId}`);
}

function lerCampos(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);
  const descricao = String(formData.get("descricao") ?? "")
    .trim()
    .slice(0, MAX_DESCRICAO_EVENTO);
  const bruto = String(formData.get("publicar_em") ?? "").trim();
  const publicarEm = bruto ? new Date(bruto) : new Date();
  const exigeInscricao = String(formData.get("exige_inscricao") ?? "") === "sim";
  const reais = Number(
    String(formData.get("valor_reais") ?? "0").trim().replace(",", ".")
  );
  const valorCentavos = exigeInscricao ? Math.round(reais * 100) : 0;

  return {
    nome,
    descricao: descricao || null,
    publicarEm,
    exigeInscricao,
    valorCentavos,
    reais,
  };
}

async function enviarImagem(supabase: SupabaseClient, arquivo: File) {
  if (arquivo.size > TAMANHO_MAX_POST) {
    return { erro: "A imagem pode ter no máximo 5 MB." };
  }
  if (!TIPOS_POST.includes(arquivo.type as (typeof TIPOS_POST)[number])) {
    return { erro: "Use PNG, JPG ou WebP." };
  }

  const extensoes: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
  };
  const extensao = extensoes[arquivo.type];
  if (!extensao) return { erro: "Use PNG, JPG ou WebP." };
  const caminho = `${crypto.randomUUID()}.${extensao}`;

  const { error } = await supabase.storage
    .from(BUCKET_EVENTOS)
    .upload(caminho, arquivo, { contentType: arquivo.type });

  if (error) {
    return { erro: "Não foi possível enviar a imagem. Rode a migration 007 no Supabase." };
  }

  return { caminho };
}

export async function criarEvento(formData: FormData) {
  if (!(await exigeEquipeMidia())) return { erro: "Sem permissão." };

  const { nome, descricao, publicarEm, exigeInscricao, valorCentavos, reais } =
    lerCampos(formData);
  const arquivo = formData.get("imagem");

  if (!nome) return { erro: "Escreva o nome do evento." };
  if (Number.isNaN(publicarEm.getTime())) {
    return { erro: "Data de publicação inválida." };
  }
  if (exigeInscricao && (!Number.isFinite(reais) || valorCentavos < 100)) {
    return { erro: "Informe o valor da inscrição, no mínimo R$ 1,00." };
  }
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: "Envie a imagem do post." };
  }

  const supabase = await createClient();
  const upload = await enviarImagem(supabase, arquivo);
  if ("erro" in upload && upload.erro) return { erro: upload.erro };
  const caminho = upload.caminho!;

  const { error } = await supabase.from("eventos").insert({
    nome,
    descricao,
    imagem_path: caminho,
    publicar_em: publicarEm.toISOString(),
    exige_inscricao: exigeInscricao,
    valor_centavos: valorCentavos,
  });

  if (error) {
    await supabase.storage.from(BUCKET_EVENTOS).remove([caminho]);
    return { erro: "Não foi possível salvar. Rode a migration 009 no Supabase." };
  }

  revalidar();
  return { ok: true };
}

export async function atualizarEvento(id: string, formData: FormData) {
  if (!uuidValido(id)) return { erro: "Evento inválido." };
  if (!(await exigeEquipeMidia())) return { erro: "Sem permissão." };

  const { nome, descricao, publicarEm, exigeInscricao, valorCentavos, reais } =
    lerCampos(formData);
  if (!nome) return { erro: "Escreva o nome do evento." };
  if (Number.isNaN(publicarEm.getTime())) {
    return { erro: "Data de publicação inválida." };
  }
  if (exigeInscricao && (!Number.isFinite(reais) || valorCentavos < 100)) {
    return { erro: "Informe o valor da inscrição, no mínimo R$ 1,00." };
  }

  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("eventos")
    .select("imagem_path")
    .eq("id", id)
    .single();

  if (!atual) return { erro: "Evento não encontrado." };

  const arquivo = formData.get("imagem");
  let caminho = atual.imagem_path;
  let caminhoNovo: string | null = null;

  if (arquivo instanceof File && arquivo.size > 0) {
    const upload = await enviarImagem(supabase, arquivo);
    if ("erro" in upload && upload.erro) return { erro: upload.erro };
    caminhoNovo = upload.caminho!;
    caminho = caminhoNovo;
  }

  const { error } = await supabase
    .from("eventos")
    .update({
      nome,
      descricao,
      imagem_path: caminho,
      publicar_em: publicarEm.toISOString(),
      exige_inscricao: exigeInscricao,
      valor_centavos: valorCentavos,
    })
    .eq("id", id);

  if (error) {
    if (caminhoNovo) {
      await supabase.storage.from(BUCKET_EVENTOS).remove([caminhoNovo]);
    }
    return { erro: "Não foi possível salvar as alterações." };
  }

  if (caminhoNovo && atual.imagem_path) {
    await supabase.storage.from(BUCKET_EVENTOS).remove([atual.imagem_path]);
  }

  revalidar(id);
  revalidatePath(`/painel/eventos/${id}`);
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

  revalidar();
}
