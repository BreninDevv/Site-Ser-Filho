/**
 * Acesso a Únicas — frontend + helpers de API.
 *
 * Público real: feminino/mulher logadas.
 * Dev: sempre pode ver/testar (nav, rota, inscrição).
 *
 * IMPORTANTE — SEGURANÇA EM PROFUNDIDADE:
 * O BACKEND (API / RLS / RPC) TAMBÉM DEVE VALIDAR.
 * NUNCA CONFIE SÓ NO FRONTEND.
 */

import { eDev } from "@/lib/auth/roles";

export function ehGeneroUnicas(valor: string | null | undefined): boolean {
  if (!valor) return false;
  const normalizado = valor.trim().toLowerCase();
  return normalizado === "feminino" || normalizado === "mulher";
}

/** Nav, rota e API: público feminino OU role Dev (para testes). */
export function podeAcessarUnicas(opcoes: {
  role?: string | null;
  sexo?: string | null;
}): boolean {
  if (eDev(opcoes.role)) return true;
  return ehGeneroUnicas(opcoes.sexo);
}
