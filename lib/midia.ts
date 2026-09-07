export const INSTAGRAM_SER_FILHO = "https://www.instagram.com/ministerioserfilho";
export const MAX_TESTEMUNHOS = 3;
export const BUCKET_EVENTOS = "eventos-posts";
export const BUCKET_TESTEMUNHOS = "testemunhos-previas";
export const TAMANHO_MAX_POST = 5 * 1024 * 1024;
export const TAMANHO_MAX_PREVIA = 12 * 1024 * 1024;
export const TIPOS_POST = ["image/png", "image/jpeg", "image/webp"] as const;
export const TIPOS_PREVIA = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/webm",
] as const;
export const MAX_DESCRICAO_EVENTO = 800;
export const MAX_DESCRICAO_TESTEMUNHO = 280;

export function urlPublicaDoPost(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  const limpo = path.split("/").pop() ?? "";
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp)$/i.test(
      limpo
    )
  ) {
    return "";
  }
  return `${base}/storage/v1/object/public/${BUCKET_EVENTOS}/${limpo}`;
}

export function urlPublicaDaPrevia(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  const limpo = path.split("/").pop() ?? "";
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|mp4|webm)$/i.test(
      limpo
    )
  ) {
    return "";
  }
  return `${base}/storage/v1/object/public/${BUCKET_TESTEMUNHOS}/${limpo}`;
}

export function previaEhVideo(path: string) {
  return /\.(mp4|webm)$/i.test(path);
}

export function destinoDoTestemunho(url: string): string | null {
  const texto = url.trim();
  if (!texto || texto.length > 500) return null;
  if (/^(javascript|data|file|vbscript):/i.test(texto)) return null;

  const href = /^https?:\/\//i.test(texto) ? texto : `https://${texto}`;

  try {
    const destino = new URL(href);
    if (destino.protocol !== "https:" && destino.protocol !== "http:") {
      return null;
    }

    const host = destino.hostname.replace(/^www\./, "").toLowerCase();
    const caminho = destino.pathname;

    const instagram =
      host === "instagram.com" &&
      /\/(reel|reels|p|tv|share)\//i.test(caminho);
    const youtube =
      (host === "youtube.com" ||
        host === "m.youtube.com" ||
        host === "youtu.be") &&
      (host === "youtu.be" ||
        /\/(watch|shorts|embed|live)\b/i.test(caminho) ||
        destino.searchParams.has("v"));

    return instagram || youtube ? destino.toString() : null;
  } catch {
    return null;
  }
}

export function eventoNoAr(publicarEm: string | Date) {
  return new Date(publicarEm).getTime() <= Date.now();
}

export function paraDatetimeLocal(iso: string | Date) {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
}

export function formatarQuando(iso: string | Date) {
  return new Date(iso).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function embedDoVideo(url: string): string | null {
  const texto = url.trim();
  if (!texto || texto.length > 500) return null;
  if (/^(javascript|data|file):/i.test(texto)) return null;

  const instagram =
    texto.match(
      /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i
    ) ??
    texto.match(/instagram\.com\/share\/(?:reel|p)\/([A-Za-z0-9_-]+)/i);
  if (instagram?.[1]) {
    const tipo = /instagram\.com\/(?:p|share\/p)\//i.test(texto) ? "p" : "reel";
    return `https://www.instagram.com/${tipo}/${instagram[1]}/embed`;
  }

  const youtube =
    texto.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/) ??
    texto.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
    ) ??
    texto.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (youtube?.[1]) return `https://www.youtube.com/embed/${youtube[1]}`;

  const vimeo = texto.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo?.[1]) return `https://player.vimeo.com/video/${vimeo[1]}`;

  return null;
}
