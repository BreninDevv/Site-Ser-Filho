"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  obterPerfilAtual,
  podeAprovarSolicitacaoPerfil,
} from "@/lib/auth/permissoes";
import { uuidValido } from "@/lib/seguranca";

function revalidar() {
  revalidatePath("/painel/solicitacoes-perfil");
  revalidatePath("/perfil");
  revalidatePath("/painel/admin/usuarios");
}

export async function aprovarSolicitacao(id: string) {
  try {
    const perfil = await obterPerfilAtual();
    if (!podeAprovarSolicitacaoPerfil(perfil)) return { erro: "Sem permissão." };
    if (!uuidValido(id)) return { erro: "Pedido inválido." };

    const supabase = await createClient();
    const { error } = await supabase.rpc("revisar_solicitacao_perfil", {
      p_id: id,
      p_aprovar: true,
    });

    if (error) {
      return {
        erro:
          /could not find|PGRST/i.test(error.message)
            ? "Falta a migration. Rode supabase/migrations/030_perfil_edicao.sql."
            : `Não foi possível aprovar. ${error.message}`,
      };
    }

    revalidar();
    return { ok: true };
  } catch (erro) {
    console.error("aprovarSolicitacao", erro);
    return { erro: "Deu erro ao aprovar." };
  }
}

export async function recusarSolicitacao(id: string) {
  try {
    const perfil = await obterPerfilAtual();
    if (!podeAprovarSolicitacaoPerfil(perfil)) return { erro: "Sem permissão." };
    if (!uuidValido(id)) return { erro: "Pedido inválido." };

    const supabase = await createClient();
    const { error } = await supabase.rpc("revisar_solicitacao_perfil", {
      p_id: id,
      p_aprovar: false,
    });

    if (error) {
      return {
        erro:
          /could not find|PGRST/i.test(error.message)
            ? "Falta a migration. Rode supabase/migrations/030_perfil_edicao.sql."
            : `Não foi possível recusar. ${error.message}`,
      };
    }

    revalidar();
    return { ok: true };
  } catch (erro) {
    console.error("recusarSolicitacao", erro);
    return { erro: "Deu erro ao recusar." };
  }
}
