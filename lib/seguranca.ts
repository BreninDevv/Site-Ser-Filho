import { headers } from "next/headers";

export {
  SENHA_MAXIMA,
  SENHA_MINIMA,
  SENHA_PADRAO,
  TEXTO_SENHA,
} from "@/lib/senha";
import { SENHA_MAXIMA, SENHA_MINIMA } from "@/lib/senha";

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FORMATO_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FORMATO_ARQUIVO_ENVIADO =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpe?g|webp|pdf)$/i;

const DESTINOS_POS_AUTH = new Set(["/redefinir-senha", "/email-confirmado"]);

const TIPOS_OTP = ["recovery", "signup", "email", "magiclink"] as const;
export type TipoOtp = (typeof TIPOS_OTP)[number];

const tentativas = new Map<string, { n: number; reset: number }>();

export function emailValido(valor: string) {
  return FORMATO_EMAIL.test(valor) && valor.length <= 254;
}

export function uuidValido(valor: string) {
  return FORMATO_UUID.test(valor);
}

export function caminhoArquivoValido(path: string | null | undefined) {
  if (!path) return true;
  return FORMATO_ARQUIVO_ENVIADO.test(path);
}

export function senhaForte(senha: string) {
  if (senha.length < SENHA_MINIMA || senha.length > SENHA_MAXIMA) return false;
  return /[A-Za-z]/.test(senha) && /\d/.test(senha);
}

export function destinoPosAuth(bruto: string | null) {
  if (!bruto) return "/redefinir-senha";
  if (
    !bruto.startsWith("/") ||
    bruto.startsWith("//") ||
    bruto.includes("\\") ||
    bruto.includes("@") ||
    bruto.includes("://")
  ) {
    return "/redefinir-senha";
  }
  const path = bruto.split("?")[0].split("#")[0];
  return DESTINOS_POS_AUTH.has(path) ? path : "/redefinir-senha";
}

export function tipoOtpSeguro(type: string | null): TipoOtp | null {
  return TIPOS_OTP.includes(type as TipoOtp) ? (type as TipoOtp) : null;
}

export async function origemDoSite() {
  const configurada = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configurada) return configurada;

  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "")
    .split(",")[0]
    .trim();
  const origin = (h.get("origin") ?? "").replace(/\/$/, "");

  if (host && origin) {
    try {
      const url = new URL(origin);
      if (
        url.host === host &&
        (url.protocol === "https:" || url.protocol === "http:")
      ) {
        return origin;
      }
    } catch {
      /* origem inválida */
    }
  }

  if (host && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
    return `http://${host}`;
  }

  return "http://localhost:3000";
}

export async function ipDoPedido() {
  try {
    const h = await headers();
    return (
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      "local"
    );
  } catch {
    return "local";
  }
}

export function dentroDoLimite(chave: string, max: number, janelaMs: number) {
  const agora = Date.now();
  const atual = tentativas.get(chave);
  if (!atual || atual.reset < agora) {
    tentativas.set(chave, { n: 1, reset: agora + janelaMs });
    return true;
  }
  if (atual.n >= max) return false;
  atual.n += 1;
  return true;
}

export function ehHoneypot(formData: FormData) {
  const isca = String(formData.get("hp_campo_extra") ?? "").trim();
  if (!isca) return false;

  const nome = String(
    formData.get("nome") ?? formData.get("nome_completo") ?? ""
  ).trim();
  const email = String(formData.get("email") ?? "").trim();
  // Chrome e gerenciador de senha às vezes preenchem o campo escondido.
  // Se o formulário tem dados reais, é pessoa — não bot.
  if (nome.length >= 3 || email.includes("@")) return false;

  return true;
}
