import { createClient } from "@/lib/supabase/server";

/**
 * Fonte única de quem pode o quê. Para liberar uma role nova (ex.: 'tesoureiro'),
 * acrescente o nome na lista certa aqui e na função equivalente do SQL
 * (`pode_ver_inscricoes` / `pode_aprovar_pagamento`). Nada mais precisa mudar.
 */
export const ROLES_QUE_VEEM_INSCRICOES = ["dev", "lider"] as const;
export const ROLES_QUE_APROVAM_PAGAMENTO = ["dev"] as const;

export type PerfilAtual = {
  id: string;
  nome: string | null;
  role: string;
};

export async function obterPerfilAtual(): Promise<PerfilAtual | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("perfis")
    .select("id, nome, role")
    .eq("id", user.id)
    .single();

  return data ?? null;
}

export function podeVerInscricoes(perfil: PerfilAtual | null) {
  return ROLES_QUE_VEEM_INSCRICOES.includes(
    perfil?.role as (typeof ROLES_QUE_VEEM_INSCRICOES)[number]
  );
}

export function podeAprovarPagamento(perfil: PerfilAtual | null) {
  return ROLES_QUE_APROVAM_PAGAMENTO.includes(
    perfil?.role as (typeof ROLES_QUE_APROVAM_PAGAMENTO)[number]
  );
}

export function podeAdminUsuarios(perfil: PerfilAtual | null) {
  return perfil?.role === "dev";
}

/**
 * Server action é endpoint público: o RLS já barra, mas cada action confere
 * também, para falhar antes de ir ao banco e não depender de uma só camada.
 */
export async function exigeAprovadorDePagamento() {
  return podeAprovarPagamento(await obterPerfilAtual());
}

export async function exigeAdminUsuarios() {
  return podeAdminUsuarios(await obterPerfilAtual());
}
