import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FormPerfil } from "./form-perfil";

export const metadata: Metadata = {
  title: "Meu perfil | Ser Filho",
  description: "Edite seus dados de cadastro.",
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/perfil");
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome, role, tempo_igreja, sexo, equipe_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!perfil) {
    redirect("/inicio");
  }

  const { data: equipes } = await supabase
    .from("equipes_pastorais")
    .select("id, nome")
    .order("nome");

  let equipeNome: string | null = null;
  if (perfil.equipe_id) {
    const { data: equipe } = await supabase
      .from("equipes_pastorais")
      .select("nome")
      .eq("id", perfil.equipe_id)
      .maybeSingle();
    equipeNome = equipe?.nome ?? null;
  }

  const { data: solicitacao } = await supabase
    .from("solicitacoes_perfil")
    .select("id, role_nova, equipe_id_nova, motivo, created_at")
    .eq("usuario_id", user.id)
    .eq("status", "pendente")
    .maybeSingle();

  let solicitacaoEquipeNome: string | null = null;
  if (solicitacao?.equipe_id_nova) {
    const { data: eq } = await supabase
      .from("equipes_pastorais")
      .select("nome")
      .eq("id", solicitacao.equipe_id_nova)
      .maybeSingle();
    solicitacaoEquipeNome = eq?.nome ?? null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8">
        <p className="mb-2 text-sm text-muted-foreground">
          <Link href="/inicio" className="underline-offset-2 hover:underline">
            Início
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Meu perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atualize o que você preencheu no cadastro. Função e equipe passam por
          aprovação.
        </p>
      </div>

      <FormPerfil
        perfil={{
          nome: perfil.nome?.trim() || "",
          role: perfil.role,
          tempo_igreja: perfil.tempo_igreja,
          sexo: perfil.sexo,
          equipe_id: perfil.equipe_id,
          equipe_nome: equipeNome,
        }}
        equipes={equipes ?? []}
        pendente={
          solicitacao
            ? {
                id: solicitacao.id,
                role_nova: solicitacao.role_nova,
                equipe_id_nova: solicitacao.equipe_id_nova,
                equipe_nome: solicitacaoEquipeNome,
                motivo: solicitacao.motivo ?? "",
                created_at: solicitacao.created_at,
              }
            : null
        }
      />
    </div>
  );
}
