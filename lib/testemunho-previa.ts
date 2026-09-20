/**
 * Detecta plataforma do link do testemunho e resolve a prévia (thumbnail).
 * YouTube: thumbnail oficial. Instagram: oEmbed / og:image.
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
  instagramCode?: string;
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
      const id =
        host === "youtu.be"
          ? path.replace(/^\//, "").slice(0, 11)
          : path.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/)?.[1] ??
            parsed.searchParams.get("v") ??
            undefined;
      if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
      return { destino, plataforma: "youtube", youtubeId: id };
    }

    if (host === "instagram.com") {
      const code =
        path.match(
          /\/(?:reel|reels|p|tv|share\/(?:reel|p))\/([A-Za-z0-9_-]+)/i
        )?.[1] ?? undefined;
      if (!code) return null;
      return { destino, plataforma: "instagram", instagramCode: code };
    }
  } catch {
    return null;
  }

  return null;
}

export function rotuloPlataforma(plataforma: PlataformaVideo) {
  return plataforma === "youtube" ? "YouTube" : "Instagram";
}

function thumbnailYoutube(id: string) {
  return {
    candidatos: [
      `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    ],
  };
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
      // YouTube às vezes não manda content-type no HEAD
      if (!tipo && head.status === 200) return true;
    }
  } catch {
    /* tenta GET abaixo */
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

async function extrairOgImage(paginaUrl: string) {
  const res = await fetch(paginaUrl, {
    redirect: "follow",
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const html = (await res.text()).slice(0, 200_000);
  const og =
    html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
    ) ??
    html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i
    );
  return og?.[1] ? og[1].replace(/&amp;/g, "&") : null;
}

async function oembedInstagram(destino: string) {
  const endpoints = [
    `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(destino)}`,
    `https://api.instagram.com/oembed/?url=${encodeURIComponent(destino)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        next: { revalidate: 0 },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as {
        thumbnail_url?: string;
        title?: string;
      };
      if (data.thumbnail_url) {
        return {
          thumbnailUrl: data.thumbnail_url,
          titulo: data.title,
        };
      }
    } catch {
      /* próximo */
    }
  }
  return null;
}

export async function obterPreviaDoLink(url: string): Promise<
  | {
      ok: true;
      plataforma: PlataformaVideo;
      destino: string;
      thumbnailUrl: string;
      titulo?: string;
      rotulo: string;
    }
  | { ok: false; erro: string }
> {
  const analise = analisarLinkVideo(url);
  if (!analise) {
    return {
      ok: false,
      erro: "Cole um link válido do Instagram (Reel/post) ou do YouTube.",
    };
  }

  if (analise.plataforma === "youtube" && analise.youtubeId) {
    const { candidatos } = thumbnailYoutube(analise.youtubeId);
    for (const candidato of candidatos) {
      if (await urlRespondeImagem(candidato)) {
        return {
          ok: true,
          plataforma: "youtube",
          destino: analise.destino,
          thumbnailUrl: candidato,
          rotulo: rotuloPlataforma("youtube"),
        };
      }
    }
    return {
      ok: true,
      plataforma: "youtube",
      destino: analise.destino,
      thumbnailUrl: candidatos[1]!,
      rotulo: rotuloPlataforma("youtube"),
    };
  }

  const oembed = await oembedInstagram(analise.destino);
  if (oembed?.thumbnailUrl) {
    return {
      ok: true,
      plataforma: "instagram",
      destino: analise.destino,
      thumbnailUrl: oembed.thumbnailUrl,
      titulo: oembed.titulo,
      rotulo: rotuloPlataforma("instagram"),
    };
  }

  const og = await extrairOgImage(analise.destino);
  if (og) {
    return {
      ok: true,
      plataforma: "instagram",
      destino: analise.destino,
      thumbnailUrl: og,
      rotulo: rotuloPlataforma("instagram"),
    };
  }

  return {
    ok: false,
    erro:
      "Não deu para puxar a prévia desse Instagram automaticamente. Envie uma foto ou vídeo curto, ou tente de novo.",
  };
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
    return { erro: "A plataforma recusou a prévia. Envie um arquivo manualmente." };
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
