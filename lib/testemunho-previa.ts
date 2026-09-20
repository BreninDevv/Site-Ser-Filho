/**
 * Prévia automática só para YouTube Shorts.
 * Instagram: a pessoa envia a prévia (foto/vídeo) manualmente.
 */
import {
  BUCKET_TESTEMUNHOS,
  destinoDoTestemunho,
} from "@/lib/midia";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PlataformaVideo = "youtube" | "instagram";

export type AnaliseLinkVideo = {
  destino: string;
  plataforma: PlataformaVideo;
  youtubeId?: string;
  ehShorts: boolean;
};

const UA =
  "Mozilla/5.0 (compatible; SerFilhoBot/1.0; +https://site-ser-filho.vercel.app)";

export function analisarLinkVideo(url: string): AnaliseLinkVideo | null {
  const destino = destinoDoTestemunho(url);
  if (!destino) return null;

  try {
    const parsed = new URL(destino);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const path = parsed.pathname;

    if (
      host === "youtu.be" ||
      host === "youtube.com" ||
      host === "m.youtube.com"
    ) {
      const ehShorts = /\/shorts\//i.test(path);
      const id = ehShorts
        ? path.match(/\/shorts\/([A-Za-z0-9_-]{11})/)?.[1]
        : host === "youtu.be"
          ? path.replace(/^\//, "").slice(0, 11)
          : path.match(/\/(?:embed|live)\/([A-Za-z0-9_-]{11})/)?.[1] ??
            parsed.searchParams.get("v") ??
            undefined;
      if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
      return {
        destino,
        plataforma: "youtube",
        youtubeId: id,
        ehShorts,
      };
    }

    if (host === "instagram.com") {
      const code = path.match(
        /\/(?:reel|reels|p|tv|share\/(?:reel|p))\/([A-Za-z0-9_-]+)/i
      )?.[1];
      if (!code) return null;
      return { destino, plataforma: "instagram", ehShorts: false };
    }
  } catch {
    return null;
  }

  return null;
}

export function ehYoutubeShorts(url: string) {
  const analise = analisarLinkVideo(url);
  return Boolean(analise?.plataforma === "youtube" && analise.ehShorts);
}

function thumbnailYoutube(id: string) {
  return [
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
  ];
}

async function urlRespondeImagem(url: string) {
  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": UA },
    });
    if (head.ok) {
      const tipo = head.headers.get("content-type") ?? "";
      if (tipo.startsWith("image/")) return true;
      if (!tipo && head.status === 200) return true;
    }
  } catch {
    /* tenta GET */
  }

  try {
    const get = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": UA, Range: "bytes=0-0" },
    });
    if (!get.ok && get.status !== 206) return false;
    const tipo = get.headers.get("content-type") ?? "";
    return tipo.startsWith("image/") || get.ok || get.status === 206;
  } catch {
    return false;
  }
}

export async function obterPreviaDoLink(url: string): Promise<
  | {
      ok: true;
      plataforma: "youtube";
      destino: string;
      thumbnailUrl: string;
      rotulo: string;
    }
  | { ok: false; erro: string; precisaArquivo?: boolean }
> {
  try {
    const analise = analisarLinkVideo(url);
    if (!analise) {
      return {
        ok: false,
        erro: "Cole um link válido do Instagram (Reel/post) ou do YouTube.",
      };
    }

    if (analise.plataforma === "instagram") {
      return {
        ok: false,
        precisaArquivo: true,
        erro:
          "No Instagram a prévia não é automática. Envie uma foto ou vídeo curto (MP4).",
      };
    }

    if (!analise.ehShorts || !analise.youtubeId) {
      return {
        ok: false,
        precisaArquivo: true,
        erro:
          "Prévia automática só funciona com YouTube Shorts. Envie uma foto ou vídeo, ou use um link /shorts/…",
      };
    }

    const candidatos = thumbnailYoutube(analise.youtubeId);
    for (const candidato of candidatos) {
      if (await urlRespondeImagem(candidato)) {
        return {
          ok: true,
          plataforma: "youtube",
          destino: analise.destino,
          thumbnailUrl: candidato,
          rotulo: "YouTube Shorts",
        };
      }
    }

    return {
      ok: true,
      plataforma: "youtube",
      destino: analise.destino,
      thumbnailUrl: candidatos[1]!,
      rotulo: "YouTube Shorts",
    };
  } catch {
    return {
      ok: false,
      precisaArquivo: true,
      erro: "Não deu para analisar o link. Envie a prévia em arquivo.",
    };
  }
}

export async function baixarPreviaParaStorage(
  supabase: SupabaseClient,
  thumbnailUrl: string
): Promise<{ caminho: string } | { erro: string }> {
  let res: Response;
  try {
    res = await fetch(thumbnailUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": UA,
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
    });
  } catch {
    return { erro: "Não consegui baixar a prévia do link." };
  }

  if (!res.ok) {
    return {
      erro: "A plataforma recusou a prévia. Envie um arquivo manualmente.",
    };
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength === 0) {
    return { erro: "A prévia veio vazia. Envie um arquivo manualmente." };
  }
  if (buffer.byteLength > 12 * 1024 * 1024) {
    return { erro: "A prévia do link passou de 12 MB." };
  }

  const tipoBruto = (res.headers.get("content-type") ?? "image/jpeg").split(
    ";"
  )[0];
  const contentType = (tipoBruto ?? "image/jpeg").trim().toLowerCase();

  const mapa: Record<string, { mime: string; ext: string }> = {
    "image/jpeg": { mime: "image/jpeg", ext: "jpg" },
    "image/jpg": { mime: "image/jpeg", ext: "jpg" },
    "image/png": { mime: "image/png", ext: "png" },
    "image/webp": { mime: "image/webp", ext: "webp" },
  };

  let escolhido = mapa[contentType];
  if (!escolhido) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      escolhido = mapa["image/jpeg"];
    } else if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e
    ) {
      escolhido = mapa["image/png"];
    } else if (buffer.slice(0, 4).toString() === "RIFF") {
      escolhido = mapa["image/webp"];
    } else {
      escolhido = mapa["image/jpeg"];
    }
  }

  const caminho = `${crypto.randomUUID()}.${escolhido!.ext}`;
  const { error } = await supabase.storage
    .from(BUCKET_TESTEMUNHOS)
    .upload(caminho, buffer, {
      contentType: escolhido!.mime,
      upsert: false,
    });

  if (error) {
    return { erro: `Não foi possível salvar a prévia. ${error.message}` };
  }

  return { caminho };
}
