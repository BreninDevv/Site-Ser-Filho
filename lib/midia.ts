export const INSTAGRAM_SER_FILHO = "https://www.instagram.com/ministerioserfilho";
export const MAX_TESTEMUNHOS = 3;
export const BUCKET_EVENTOS = "eventos-posts";
export const TAMANHO_MAX_POST = 5 * 1024 * 1024;
export const TIPOS_POST = ["image/png", "image/jpeg", "image/webp"] as const;

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
