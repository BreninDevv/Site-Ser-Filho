import { createClient } from "@/lib/supabase/server";
import {
  podeAdminUsuarios as rolePodeAdminUsuarios,
  podeAprovarPagamento as rolePodeAprovarPagamento,
  podeEditarQualquerCelula as rolePodeEditarQualquerCelula,
  podeGerenciarCelulas as rolePodeGerenciarCelulas,
  podeGerenciarMidia as rolePodeGerenciarMidia,
} from "@/lib/auth/roles";

export {
  ROLE_DEV,
  ROLES_ATRIBUIVEIS,
  ROLES_EQUIPE_MIDIA,
  ROLES_LIDER_PASTOR,
  ROLES_MASTER,
  ROLES_QUE_APROVAM_PAGAMENTO,
  ROLES_QUE_VEEM_INSCRICOES,
  ROTULOS_ROLE,
  destinoAposLogin,
  destinoDoPainel,
  eAcessoMaster,
  eDev,
  eDiscipulo,
  eLider,
  eLiderOuPastor,
  eMembro,
  podeAcessarRotaPainel,
  podeAdminUsuarios,
  podeAprovarPagamento,
  podeEditarQualquerCelula,
  podeGerenciarCelulas,
  podeGerenciarMidia,
  podeVerInscricoes,
  type RoleAtribuivel,
} from "@/lib/auth/roles";

export type PerfilAtual = {
  id: string;
  nome: string | null;
  role: string;
  equipe_id: string | null;
};

export async function obterPerfilAtual(): Promise<PerfilAtual | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("perfis")
    .select("id, nome, role, equipe_id")
    .eq("id", user.id)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    nome: data.nome,
    role: data.role,
    equipe_id: data.equipe_id ?? null,
  };
}

export async function pastorIdDaEquipeDoPerfil(
  perfil: PerfilAtual | null
): Promise<string | null> {
  if (!perfil?.equipe_id) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("equipes_pastorais")
    .select("pastor_id")
    .eq("id", perfil.equipe_id)
    .maybeSingle();

  return data?.pastor_id ?? null;
}

/**
 * Server action é endpoint público: o RLS já barra, mas cada action confere
 * também, para falhar antes de ir ao banco e não depender de uma só camada.
 */
export async function exigeAprovadorDePagamento() {
  return rolePodeAprovarPagamento(await obterPerfilAtual());
}

export async function exigeAdminUsuarios() {
  return rolePodeAdminUsuarios(await obterPerfilAtual());
}

export async function exigeEquipeMidia() {
  return rolePodeGerenciarMidia(await obterPerfilAtual());
}

export async function exigeGerenciarCelulas() {
  return rolePodeGerenciarCelulas(await obterPerfilAtual());
}

export async function podeMexerNestaCelula(liderId: string | null | undefined) {
  const perfil = await obterPerfilAtual();
  if (!rolePodeGerenciarCelulas(perfil)) return false;
  if (rolePodeEditarQualquerCelula(perfil)) return true;
  return Boolean(perfil && liderId && perfil.id === liderId);
}
