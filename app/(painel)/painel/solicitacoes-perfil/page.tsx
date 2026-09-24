import {
  obterPerfilAtual,
  podeAprovarSolicitacaoPerfil,
} from "@/lib/auth/permissoes";
import { createClient } from "@/lib/supabase/server";
import { ItemSolicitacaoPerfil } from "./item-solicitacao";

export default async function PainelSolicitacoesPerfilPage() {
  const perfil = await obterPerfilAtual();
  if (!podeAprovarSolicitacaoPerfil(perfil)) {
    return (
      <div>
        <h1 className="mb-1 text-xl font-semibold">Pedidos de perfil</h1>
        <p className="text-sm text-muted-foreground">
          Só pastor, apóstolo e Dev aprovam mudanças de função e equipe.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: pedidos, error } = await supabase
    .from("solicitacoes_perfil")
    .select(
      "id, usuario_id, role_nova, equipe_id_nova, motivo, created_at, status"
    )
    .eq("status", "pendente")
    .order("created_at", { ascending: true });

  const usuarioIds = [...new Set((pedidos ?? []).map((p) => p.usuario_id))];
  const equipeIds = [
    ...new Set(
      (pedidos ?? [])
        .map((p) => p.equipe_id_nova)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const { data: perfis } =
    usuarioIds.length > 0
      ? await supabase
          .from("perfis")
          .select("id, nome, role, equipe_id")
          .in("id", usuarioIds)
      : { data: [] as { id: string; nome: string | null; role: string; equipe_id: string | null }[] };

  const equipesUsuarioIds = [
    ...new Set(
      (perfis ?? [])
        .map((p) => p.equipe_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const todasEquipesIds = [...new Set([...equipeIds, ...equipesUsuarioIds])];

  const { data: equipes } =
    todasEquipesIds.length > 0
      ? await supabase
          .from("equipes_pastorais")
          .select("id, nome")
          .in("id", todasEquipesIds)
      : { data: [] as { id: string; nome: string }[] };

  const nomeEquipe = new Map((equipes ?? []).map((e) => [e.id, e.nome]));
  const perfilPorId = new Map((perfis ?? []).map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Pedidos de perfil</h1>
        <p className="text-sm text-muted-foreground">
          Aprove ou recuse mudanças de função e equipe pastoral pedidas no
          perfil.
        </p>
      </div>

      {error ? (
        <p className="border border-destructive/40 p-4 text-sm text-destructive">
          Não carregou os pedidos. Rode{" "}
          <code>supabase/migrations/030_perfil_edicao.sql</code> no Supabase.
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-medium">
          Pendentes ({pedidos?.length ?? 0})
        </h2>
        {!pedidos?.length ? (
          <p className="text-sm text-muted-foreground">
            Nenhum pedido aguardando.
          </p>
        ) : (
          <ul className="space-y-3">
            {pedidos.map((pedido) => {
              const quem = perfilPorId.get(pedido.usuario_id);
              return (
                <ItemSolicitacaoPerfil
                  key={pedido.id}
                  item={{
                    id: pedido.id,
                    usuario_nome: quem?.nome?.trim() || "Sem nome",
                    usuario_role: quem?.role ?? "discipulo",
                    usuario_equipe: quem?.equipe_id
                      ? (nomeEquipe.get(quem.equipe_id) ?? null)
                      : null,
                    role_nova: pedido.role_nova,
                    equipe_nova: pedido.equipe_id_nova
                      ? (nomeEquipe.get(pedido.equipe_id_nova) ?? null)
                      : null,
                    motivo: pedido.motivo ?? "",
                    created_at: pedido.created_at,
                  }}
                />
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
