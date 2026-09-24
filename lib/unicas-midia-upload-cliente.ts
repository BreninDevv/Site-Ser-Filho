"use client";

import { createClient } from "@/lib/supabase/client";
import {
  BUCKET_UNICAS_MIDIA,
  TAMANHO_MAX_UNICAS_MIDIA,
  TIPOS_UNICAS_MIDIA,
} from "@/lib/midia";

/** Upload no browser → Storage (evita limite do body na Vercel). */
export async function enviarUnicasMidiaNoCliente(
  arquivo: File
): Promise<{ caminho: string; tipo: "imagem" | "video" } | { erro: string }> {
  if (arquivo.size > TAMANHO_MAX_UNICAS_MIDIA) {
    return { erro: "O arquivo pode ter no máximo 50 MB." };
  }
  if (
    !TIPOS_UNICAS_MIDIA.includes(
      arquivo.type as (typeof TIPOS_UNICAS_MIDIA)[number]
    )
  ) {
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
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET_UNICAS_MIDIA)
    .upload(caminho, arquivo, {
      contentType: arquivo.type,
      upsert: false,
    });

  if (error) {
    return {
      erro:
        error.message.includes("policy") || error.message.includes("row-level")
          ? "Sem permissão para enviar. Entre de novo e tente."
          : `Não foi possível enviar. ${error.message}`,
    };
  }

  return {
    caminho,
    tipo: arquivo.type.startsWith("video/") ? "video" : "imagem",
  };
}

export function caminhoUnicasMidiaValido(path: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|mp4|webm)$/i.test(
    path.trim()
  );
}
