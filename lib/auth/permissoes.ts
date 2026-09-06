import { createClient } from "@/lib/supabase/server";

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

export function podeGerenciar(perfil: PerfilAtual | null) {
  return perfil?.role === "dev" || perfil?.role === "lider";
}

/** O RLS já barra quem não é líder/dev; isto evita a ida ao banco e devolve erro claro. */
export async function ehLiderOuDev() {
  return podeGerenciar(await obterPerfilAtual());
}
