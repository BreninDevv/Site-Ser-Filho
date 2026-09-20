"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  exigeAdminUsuarios,
  obterPerfilAtual,
} from "@/lib/auth/permissoes";
import {
  ROLES_ATRIBUIVEIS,
  eDev,
  podeExcluirUsuarios,
  type RoleAtribuivel,
} from "@/lib/auth/roles";
import { emailValido, uuidValido } from "@/lib/seguranca";
import type { CredencialFicticia } from "./tipos";

const ROLES_FICTICIAS = [
  "discipulo",
  "pendente",
  "lider",
  "lider_tesouraria",
  "pastor",
  "midia",
  "tesouraria",
  "apostolo",
] as const;

type RoleFicticia = (typeof ROLES_FICTICIAS)[number];

function ehRoleFicticia(role: string): role is RoleFicticia {
  return (ROLES_FICTICIAS as readonly string[]).includes(role);
}

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

async function chamarCriarFicticio(params: {
  nome: string;
  role: RoleFicticia;
  email?: string;
  senha?: string;
  equipeNome?: string;
}): Promise<
  { ok: true; credencial: CredencialFicticia } | { ok: false; mensagem: string }
> {
  const eu = await obterPerfilAtual();
  if (!eu || !eDev(eu)) {
    return { ok: false, mensagem: "Somente Dev pode criar perfil fictício." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("criar_perfil_ficticio", {
    p_nome: params.nome,
    p_role: params.role,
    p_email: params.email ?? null,
    p_senha: params.senha ?? null,
    p_equipe_nome: params.equipeNome ?? null,
  });

  if (error) {
    const msg = error.message ?? "";
    if (/somente Dev/i.test(msg)) {
      return { ok: false, mensagem: "Somente Dev pode criar perfil fictício." };
    }
    if (/email ja cadastrado/i.test(msg)) {
      return { ok: false, mensagem: "Esse e-mail já está cadastrado." };
    }
    if (/could not find the function|schema cache|does not exist/i.test(msg)) {
      return {
        ok: false,
        mensagem:
          "Função ausente no banco. Rode a migration 023_criar_perfil_ficticio.sql no Supabase.",
      };
    }
    return {
      ok: false,
      mensagem: msg || "Não foi possível criar o perfil fictício.",
    };
  }

  const cred = data as CredencialFicticia;
  if (!cred?.email || !cred?.senha) {
    return { ok: false, mensagem: "Resposta inválida do banco." };
  }

  revalidatePath("/painel/admin/usuarios");
  return { ok: true, credencial: cred };
}

export async function criarPerfilFicticio(formData: FormData): Promise<
  | { ok: true; credencial: CredencialFicticia }
  | { ok: false; mensagem: string }
> {
  const nome = String(formData.get("nome") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const emailBruto = String(formData.get("email") ?? "").trim().toLowerCase();
  const equipeNome = String(formData.get("equipe_nome") ?? "").trim();

  if (nome.length < 2) {
    return { ok: false, mensagem: "Informe um nome (mín. 2 letras)." };
  }
  if (!ehRoleFicticia(role)) {
    return { ok: false, mensagem: "Escolha uma função válida." };
  }
  if (emailBruto && !emailValido(emailBruto)) {
    return { ok: false, mensagem: "E-mail inválido." };
  }

  return chamarCriarFicticio({
    nome,
    role,
    email: emailBruto || undefined,
    equipeNome: role === "pastor" ? equipeNome || "Equipe Teste" : undefined,
  });
}

export async function criarKitPerfisFicticios(): Promise<
  | { ok: true; credenciais: CredencialFicticia[] }
  | { ok: false; mensagem: string }
> {
  const eu = await obterPerfilAtual();
  if (!eu || !eDev(eu)) {
    return { ok: false, mensagem: "Somente Dev pode criar perfil fictício." };
  }

  const kit: { role: RoleFicticia; nome: string; equipe?: string }[] = [
    { role: "discipulo", nome: "Discípulo Teste" },
    { role: "pendente", nome: "Pendente Teste" },
    { role: "lider", nome: "Líder Teste" },
    { role: "lider_tesouraria", nome: "Líder Tesouraria Teste" },
    { role: "pastor", nome: "Pastor Teste", equipe: "Equipe Teste" },
    { role: "midia", nome: "Mídia Teste" },
    { role: "tesouraria", nome: "Tesouraria Teste" },
    { role: "apostolo", nome: "Apóstolo Teste" },
  ];

  const credenciais: CredencialFicticia[] = [];
  for (const item of kit) {
    const resultado = await chamarCriarFicticio({
      nome: item.nome,
      role: item.role,
      equipeNome: item.equipe,
    });
    if (!resultado.ok) {
      return {
        ok: false,
        mensagem: `${item.role}: ${resultado.mensagem}`,
      };
    }
    credenciais.push(resultado.credencial);
  }

  revalidatePath("/painel/admin/usuarios");
  return { ok: true, credenciais };
}
