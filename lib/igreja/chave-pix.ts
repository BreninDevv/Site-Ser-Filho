import { createClient } from "@/lib/supabase/server";
import { CHAVE_PIX_FALLBACK } from "@/lib/validations/pagamento-encontro";
import { podeAprovarPagamento, obterPerfilAtual } from "@/lib/auth/permissoes";

export async function obterChavePix(): Promise<string> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("obter_chave_pix");
    if (error || typeof data !== "string" || !data.trim()) {
      return CHAVE_PIX_FALLBACK;
    }
    return data.trim();
  } catch {
    return CHAVE_PIX_FALLBACK;
  }
}

export async function podeEditarChavePix() {
  return podeAprovarPagamento(await obterPerfilAtual());
}

export async function salvarChavePix(
  chave: string
): Promise<{ ok: true; chave: string } | { ok: false; mensagem: string }> {
  const perfil = await obterPerfilAtual();
  if (!podeAprovarPagamento(perfil)) {
    return { ok: false, mensagem: "Sem permissão para editar a chave Pix." };
  }

  const limpa = chave.trim().slice(0, 200);
  if (limpa.length < 5) {
    return { ok: false, mensagem: "Informe uma chave Pix válida." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("salvar_chave_pix", {
    p_chave: limpa,
  });

  if (error) {
    const msg = error.message ?? "";
    if (/could not find the function|does not exist|schema cache/i.test(msg)) {
      return {
        ok: false,
        mensagem:
          "Rode a migration 024_pix_e_aprovacao_lider_tesouraria.sql no Supabase.",
      };
    }
    if (/sem permissao/i.test(msg)) {
      return { ok: false, mensagem: "Sem permissão para editar a chave Pix." };
    }
    return { ok: false, mensagem: msg || "Não foi possível salvar a chave." };
  }

  return { ok: true, chave: String(data ?? limpa) };
}
