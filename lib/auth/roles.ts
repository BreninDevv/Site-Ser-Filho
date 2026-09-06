/**
 * Fonte única dos nomes de role. O SQL (`e_acesso_master`,
 * `pode_ver_inscricoes`, `pode_aprovar_pagamento`) precisa da mesma lista.
 */
export const ROLES_MASTER = ["dev", "tesouraria", "apostolo"] as const;
export const ROLE_LIDER = "lider";
export const ROLE_PENDENTE = "pendente";

export const ROLES_QUE_VEEM_INSCRICOES = [
  ...ROLES_MASTER,
  ROLE_LIDER,
] as const;

export const ROLES_QUE_APROVAM_PAGAMENTO = ROLES_MASTER;

export const ROLES_ATRIBUIVEIS = [
  ROLE_PENDENTE,
  ROLE_LIDER,
  "tesouraria",
  "apostolo",
] as const;

export type RoleMaster = (typeof ROLES_MASTER)[number];
export type RoleAtribuivel = (typeof ROLES_ATRIBUIVEIS)[number];

export const ROTULOS_ROLE: Record<string, string> = {
  dev: "Dev",
  tesouraria: "Tesouraria",
  apostolo: "Apóstolo(a)",
  lider: "Líder/Pastor",
  pendente: "Aguardando aprovação",
};

function roleDe(
  perfilOuRole: { role: string } | string | null | undefined
): string | null {
  if (!perfilOuRole) return null;
  return typeof perfilOuRole === "string" ? perfilOuRole : perfilOuRole.role;
}

export function eAcessoMaster(
  perfilOuRole: { role: string } | string | null | undefined
) {
  const role = roleDe(perfilOuRole);
  return ROLES_MASTER.includes(role as RoleMaster);
}

export function podeVerInscricoes(
  perfilOuRole: { role: string } | string | null | undefined
) {
  const role = roleDe(perfilOuRole);
  return ROLES_QUE_VEEM_INSCRICOES.includes(
    role as (typeof ROLES_QUE_VEEM_INSCRICOES)[number]
  );
}

export function podeAprovarPagamento(
  perfilOuRole: { role: string } | string | null | undefined
) {
  return eAcessoMaster(perfilOuRole);
}

export function podeAdminUsuarios(
  perfilOuRole: { role: string } | string | null | undefined
) {
  return eAcessoMaster(perfilOuRole);
}

export function podeGerenciarCelulas(
  perfilOuRole: { role: string } | string | null | undefined
) {
  const role = roleDe(perfilOuRole);
  return eAcessoMaster(role) || role === ROLE_LIDER;
}

export function podeEditarQualquerCelula(
  perfilOuRole: { role: string } | string | null | undefined
) {
  return eAcessoMaster(perfilOuRole);
}

export function destinoAposLogin(role: string | null | undefined) {
  if (eAcessoMaster(role)) return "/painel";
  if (role === ROLE_LIDER) return "/painel/encontro";
  return "/inicio";
}

export function destinoDoPainel(role: string | null | undefined) {
  if (eAcessoMaster(role)) return "/painel";
  if (role === ROLE_LIDER) return "/painel/encontro";
  return null;
}

export function podeAcessarRotaPainel(
  role: string | null | undefined,
  pathname: string
) {
  if (eAcessoMaster(role)) return true;
  if (role === ROLE_LIDER) {
    return (
      pathname === "/painel/encontro" ||
      pathname.startsWith("/painel/encontro/") ||
      pathname === "/painel/legado" ||
      pathname.startsWith("/painel/legado/")
    );
  }
  return false;
}
