"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  exigeAdminUsuarios,
  obterPerfilAtual,
} from "@/lib/auth/permissoes";
import {
  ROLES_ATRIBUIVEIS,
  podeExcluirUsuarios,
  type RoleAtribuivel,
} from "@/lib/auth/roles";
import { uuidValido } from "@/lib/seguranca";

export async function definirRole(userId: string, role: RoleAtribuivel) {
  if (!(await exigeAdminUsuarios())) return;
  if (!uuidValido(userId)) return;
  if (!ROLES_ATRIBUIVEIS.includes(role)) return;

  const eu = await obterPerfilAtual();
  if (!eu || eu.id === userId) return;

  const supabase = await createClient();
  const { data: alvo } = await supabase
    .from("perfis")
    .select("role")
    .eq("id", userId)
    .single();

  if (!alvo || alvo.role === "dev") return;

  await supabase.from("perfis").update({ role }).eq("id", userId);
  revalidatePath("/painel/admin/usuarios");
}

export async function excluirUsuario(
  userId: string
): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  const eu = await obterPerfilAtual();
  if (!eu || !podeExcluirUsuarios(eu)) {
    return { ok: false, mensagem: "Sem permissão para excluir usuários." };
  }
  if (!uuidValido(userId)) {
    return { ok: false, mensagem: "Usuário inválido." };
  }
  if (eu.id === userId) {
    return { ok: false, mensagem: "Você não pode excluir a si mesmo." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("excluir_usuario_painel", {
    alvo: userId,
  });

  if (error) {
    const msg = error.message ?? "";
    if (/nao pode excluir a si mesmo/i.test(msg)) {
      return { ok: false, mensagem: "Você não pode excluir a si mesmo." };
    }
    if (/nao e permitido excluir conta Dev/i.test(msg)) {
      return { ok: false, mensagem: "Não é permitido excluir conta Dev." };
    }
    if (/pastor so pode excluir/i.test(msg)) {
      return {
        ok: false,
        mensagem:
          "Pastor só pode excluir discípulos, líderes, mídia e pendentes.",
      };
    }
    if (/sem permissao/i.test(msg)) {
      return { ok: false, mensagem: "Sem permissão para excluir usuários." };
    }
    return {
      ok: false,
      mensagem:
        msg ||
        "Não foi possível excluir. Confira se a migration 022 rodou no Supabase.",
    };
  }

  revalidatePath("/painel/admin/usuarios");
  return { ok: true };
}
