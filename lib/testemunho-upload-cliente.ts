"use client";

import { createClient } from "@/lib/supabase/client";
import {
  BUCKET_TESTEMUNHOS,
  TAMANHO_MAX_PREVIA,
  TIPOS_PREVIA,
} from "@/lib/midia";

/** Upload no browser → Storage (evita limite ~4,5 MB do body na Vercel). */
export async function enviarPreviaNoCliente(
  arquivo: File
): Promise<{ caminho: string } | { erro: string }> {
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
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET_TESTEMUNHOS)
    .upload(caminho, arquivo, {
      contentType: arquivo.type,
      upsert: false,
    });

  if (error) {
    return {
      erro:
        error.message.includes("policy") || error.message.includes("row-level")
          ? "Sem permissão para enviar a prévia. Entre de novo e tente."
          : `Não foi possível enviar a prévia. ${error.message}`,
    };
  }

  return { caminho };
}

export function caminhoPreviaValido(path: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|mp4|webm)$/i.test(
    path.trim()
  );
}
