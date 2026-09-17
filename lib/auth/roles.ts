/**
 * Fonte única dos nomes de role. O SQL (`e_acesso_master`,
 * `e_equipe_midia`, `pode_ver_inscricoes`, `pode_aprovar_pagamento`,
 * `pode_conferir_planilha`) precisa da mesma lista.
 *
 * Dev entra em tudo o que for implantado daqui pra frente.
 * Tesouraria, Líder e Pastor não mexem em eventos/testemunhos.
 * Líder / Tesouraria: acesso de líder + planilha de chegada na porta.
 * Discípulo é conta na base, sem painel — navega como visitante logado.
 */
export const ROLE_DEV = "dev";
export const ROLES_MASTER = ["dev", "tesouraria", "apostolo"] as const;
export const ROLE_LIDER = "lider";
export const ROLE_LIDER_TESOURARIA = "lider_tesouraria";
export const ROLE_PASTOR = "pastor";
export const ROLE_DISCIPULO = "discipulo";
export const ROLE_MEMBRO = ROLE_DISCIPULO;
export const ROLE_PENDENTE = "pendente";
export const ROLE_MIDIA = "midia";

export const ROLES_LIDER_PASTOR = [
  ROLE_LIDER,
  ROLE_LIDER_TESOURARIA,
  ROLE_PASTOR,
] as const;

export const ROLES_EQUIPE_MIDIA = ["dev", "apostolo", "midia"] as const;

export const ROLES_QUE_VEEM_INSCRICOES = [
  ...ROLES_MASTER,
  ROLE_LIDER,
  ROLE_LIDER_TESOURARIA,
  ROLE_PASTOR,
] as const;

export const ROLES_QUE_APROVAM_PAGAMENTO = ROLES_MASTER;

export const ROLES_QUE_CONFEREM_PLANILHA = [
  ...ROLES_MASTER,
  ROLE_LIDER_TESOURARIA,
] as const;

export const ROLES_ATRIBUIVEIS = [
  ROLE_DISCIPULO,
  ROLE_PENDENTE,
  ROLE_LIDER,
  ROLE_LIDER_TESOURARIA,
  ROLE_PASTOR,
  ROLE_MIDIA,
  "tesouraria",
  "apostolo",
] as const;

export type RoleMaster = (typeof ROLES_MASTER)[number];
export type RoleAtribuivel = (typeof ROLES_ATRIBUIVEIS)[number];
export type RoleEquipeMidia = (typeof ROLES_EQUIPE_MIDIA)[number];
export type RoleLiderPastor = (typeof ROLES_LIDER_PASTOR)[number];

export const ROTULOS_ROLE: Record<string, string> = {
  dev: "Dev",
  tesouraria: "Tesouraria",
  apostolo: "Apóstolo(a)",
  lider: "Líder",
  lider_tesouraria: "Líder / Tesouraria",
  pastor: "Pastor",
  discipulo: "Discípulo",
  membro: "Discípulo",
  midia: "Líder de mídia",
  pendente: "Aguardando aprovação",
};

function roleDe(
  perfilOuRole: { role: string } | string | null | undefined
): string | null {
  if (!perfilOuRole) return null;
  return typeof perfilOuRole === "string" ? perfilOuRole : perfilOuRole.role;
}

export function eDev(
  perfilOuRole: { role: string } | string | null | undefined
) {
  return roleDe(perfilOuRole) === ROLE_DEV;
}

export function eAcessoMaster(
  perfilOuRole: { role: string } | string | null | undefined
) {
  const role = roleDe(perfilOuRole);
  return ROLES_MASTER.includes(role as RoleMaster);
}

export function eLider(
  perfilOuRole: { role: string } | string | null | undefined
) {
  const role = roleDe(perfilOuRole);
  return role === ROLE_LIDER || role === ROLE_LIDER_TESOURARIA;
}

export function eLiderTesouraria(
  perfilOuRole: { role: string } | string | null | undefined
) {
  return roleDe(perfilOuRole) === ROLE_LIDER_TESOURARIA;
}

export function eLiderOuPastor(
  perfilOuRole: { role: string } | string | null | undefined
) {
  const role = roleDe(perfilOuRole);
  return ROLES_LIDER_PASTOR.includes(role as RoleLiderPastor);
}

export function eDiscipulo(
  perfilOuRole: { role: string } | string | null | undefined
) {
  const role = roleDe(perfilOuRole);
  return role === ROLE_DISCIPULO || role === "membro";
}

export function eMembro(
  perfilOuRole: { role: string } | string | null | undefined
) {
  return eDiscipulo(perfilOuRole);
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

export function podeConferirPlanilha(
  perfilOuRole: { role: string } | string | null | undefined
) {
  const role = roleDe(perfilOuRole);
  return ROLES_QUE_CONFEREM_PLANILHA.includes(
    role as (typeof ROLES_QUE_CONFEREM_PLANILHA)[number]
  );
}

export function podeAdminUsuarios(
  perfilOuRole: { role: string } | string | null | undefined
) {
  const role = roleDe(perfilOuRole);
  return eAcessoMaster(role) || role === ROLE_PASTOR;
}

export function podeExcluirUsuarios(
  perfilOuRole: { role: string } | string | null | undefined
) {
  const role = roleDe(perfilOuRole);
  return (
    role === ROLE_DEV ||
    role === "tesouraria" ||
    role === "apostolo" ||
    role === ROLE_PASTOR
  );
}

/** Espelha as regras de `excluir_usuario_painel` (migration 022). */
export function podeExcluirEsteUsuario(
  quemExclui: { id: string; role: string } | null | undefined,
  alvo: { id: string; role: string }
) {
  if (!quemExclui || !podeExcluirUsuarios(quemExclui)) return false;
  if (quemExclui.id === alvo.id) return false;
  if (alvo.role === ROLE_DEV) return false;
  if (
    quemExclui.role === ROLE_PASTOR &&
    (alvo.role === "tesouraria" ||
      alvo.role === "apostolo" ||
      alvo.role === ROLE_PASTOR)
  ) {
    return false;
  }
  return true;
}

export function podeGerenciarCelulas(
  perfilOuRole: { role: string } | string | null | undefined
) {
  const role = roleDe(perfilOuRole);
  return eAcessoMaster(role) || eLiderOuPastor(role);
}

export function podeEditarQualquerCelula(
  perfilOuRole: { role: string } | string | null | undefined
) {
  return eAcessoMaster(perfilOuRole);
}

export function podeGerenciarMidia(
  perfilOuRole: { role: string } | string | null | undefined
) {
  const role = roleDe(perfilOuRole);
  return ROLES_EQUIPE_MIDIA.includes(role as RoleEquipeMidia);
}

function rotaDeInscricoesEvento(pathname: string) {
  return (
    pathname === "/painel/inscricoes-eventos" ||
    pathname.startsWith("/painel/inscricoes-eventos/")
  );
}

function rotaDePlanilha(pathname: string) {
  return (
    pathname === "/painel/planilha-inscricoes" ||
    pathname.startsWith("/painel/planilha-inscricoes/")
  );
}

function rotaDeMidia(pathname: string) {
  return (
    pathname === "/painel/eventos" ||
    pathname.startsWith("/painel/eventos/") ||
    pathname === "/painel/testemunhos" ||
    pathname.startsWith("/painel/testemunhos/")
  );
}

export function destinoAposLogin(_role?: string | null) {
  return "/inicio";
}

export function destinoDoPainel(role: string | null | undefined) {
  if (eAcessoMaster(role)) return "/painel";
  if (role === ROLE_LIDER_TESOURARIA) return "/painel/planilha-inscricoes";
  if (eLiderOuPastor(role)) return "/painel/encontro";
  if (role === ROLE_MIDIA) return "/painel/eventos";
  return null;
}

export function podeAcessarRotaPainel(
  role: string | null | undefined,
  pathname: string
) {
  if (eDev(role)) return true;

  if (role === "apostolo") return true;

  if (role === "tesouraria") {
    if (rotaDeMidia(pathname)) return false;
    return (
      pathname === "/painel" ||
      pathname.startsWith("/painel/encontro") ||
      pathname.startsWith("/painel/legado") ||
      rotaDeInscricoesEvento(pathname) ||
      rotaDePlanilha(pathname) ||
      pathname.startsWith("/painel/admin")
    );
  }

  if (role === ROLE_LIDER_TESOURARIA) {
    return (
      pathname === "/painel/encontro" ||
      pathname.startsWith("/painel/encontro/") ||
      pathname === "/painel/legado" ||
      pathname.startsWith("/painel/legado/") ||
      rotaDePlanilha(pathname)
    );
  }

  if (role === ROLE_PASTOR) {
    return (
      pathname === "/painel/encontro" ||
      pathname.startsWith("/painel/encontro/") ||
      pathname === "/painel/legado" ||
      pathname.startsWith("/painel/legado/") ||
      pathname.startsWith("/painel/admin")
    );
  }

  if (eLiderOuPastor(role)) {
    return (
      pathname === "/painel/encontro" ||
      pathname.startsWith("/painel/encontro/") ||
      pathname === "/painel/legado" ||
      pathname.startsWith("/painel/legado/")
    );
  }
  if (role === ROLE_MIDIA) {
    return rotaDeMidia(pathname);
  }
  return false;
}
