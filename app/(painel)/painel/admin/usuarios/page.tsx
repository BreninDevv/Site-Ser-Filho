import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  obterPerfilAtual,
  podeAdminUsuarios,
} from "@/lib/auth/permissoes";
import {
  ROLES_MASTER,
  ROTULOS_ROLE,
  type RoleAtribuivel,
} from "@/lib/auth/roles";
import { definirRole } from "./actions";

function AcaoRole({
  userId,
  role,
  rotulo,
  outline,
}: {
  userId: string;
  role: RoleAtribuivel;
  rotulo: string;
  outline?: boolean;
}) {
  return (
    <form action={definirRole.bind(null, userId, role)}>
      <Button size="sm" type="submit" variant={outline ? "outline" : "default"}>
        {rotulo}
      </Button>
    </form>
  );
}

export default async function AdminUsuariosPage() {
  const perfil = await obterPerfilAtual();
  if (!podeAdminUsuarios(perfil)) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-1">Admin · Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Apenas Dev, Tesouraria e Apóstolo(a) podem gerenciar acessos.
        </p>
      </div>
    );
  }

  const supabase = await createClient();

  const { data: usuarios } = await supabase
    .from("perfis")
    .select("id, nome, role, created_at")
    .order("created_at", { ascending: false });

  const pendentes = usuarios?.filter((u) => u.role === "pendente") ?? [];
  const midias = usuarios?.filter((u) => u.role === "midia") ?? [];
  const lideres = usuarios?.filter((u) => u.role === "lider") ?? [];
  const masters = usuarios?.filter((u) =>
    ROLES_MASTER.includes(u.role as (typeof ROLES_MASTER)[number])
  ) ?? [];

  return (
    <div className="space-y-10 p-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">Admin · Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Você está logado como Dev. Quem se cadastra no site entra em
          <strong> Aguardando aprovação</strong>. É aqui que você libera o
          acesso: clique no botão da função dela.
        </p>
        <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Dev</strong> — acesso a tudo,
            inclusive o que for implantado daqui pra frente.
          </li>
          <li>
            <strong className="text-foreground">Apóstolo(a)</strong> — painel
            completo, inclusive Eventos e Testemunhos.
          </li>
          <li>
            <strong className="text-foreground">Mídia</strong> — Eventos
            (editar, programar, descrição e se precisa de inscrição) e os 3
            testemunhos da home.
          </li>
          <li>
            <strong className="text-foreground">Tesouraria</strong> —
            inscrições e pagamento (Encontro, Legado e eventos com inscrição).
            Sem editar posts de Eventos e sem Testemunhos.
          </li>
          <li>
            <strong className="text-foreground">Líder/Pastor</strong> — vê
            inscrições, sem aprovar pagamento e sem mídia.
          </li>
        </ul>
      </div>

      <section>
        <h2 className="text-sm font-medium mb-3">
          Aguardando aprovação ({pendentes.length})
        </h2>
        {pendentes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma solicitação pendente.</p>
        ) : (
          <ul className="space-y-2">
            {pendentes.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 border rounded-lg px-4 py-3"
              >
                <span className="text-sm">{u.nome}</span>
                <div className="flex flex-wrap gap-2">
                  <AcaoRole userId={u.id} role="lider" rotulo="Líder/Pastor" />
                  <AcaoRole userId={u.id} role="midia" rotulo="Mídia" outline />
                  <AcaoRole userId={u.id} role="tesouraria" rotulo="Tesouraria" outline />
                  <AcaoRole userId={u.id} role="apostolo" rotulo="Apóstolo(a)" outline />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium mb-3">
          Acessos master ({masters.length})
        </h2>
        {masters.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum acesso master ainda.</p>
        ) : (
          <ul className="space-y-2">
            {masters.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 border rounded-lg px-4 py-3"
              >
                <span className="text-sm">
                  {u.nome}{" "}
                  <span className="text-muted-foreground">
                    ({ROTULOS_ROLE[u.role] ?? u.role})
                  </span>
                </span>
                {u.role === "dev" || u.id === perfil?.id ? (
                  <span className="text-xs text-muted-foreground">
                    {u.id === perfil?.id ? "É você" : "Não se altera por aqui"}
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {u.role !== "tesouraria" && (
                      <AcaoRole userId={u.id} role="tesouraria" rotulo="Tesouraria" outline />
                    )}
                    {u.role !== "apostolo" && (
                      <AcaoRole userId={u.id} role="apostolo" rotulo="Apóstolo(a)" outline />
                    )}
                    <AcaoRole userId={u.id} role="lider" rotulo="Virar líder" outline />
                    <AcaoRole userId={u.id} role="midia" rotulo="Virar mídia" outline />
                    <AcaoRole userId={u.id} role="pendente" rotulo="Remover acesso" outline />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium mb-3">
          Líderes/pastores ativos ({lideres.length})
        </h2>
        {lideres.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum líder ativo ainda.</p>
        ) : (
          <ul className="space-y-2">
            {lideres.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 border rounded-lg px-4 py-3"
              >
                <span className="text-sm">{u.nome}</span>
                <div className="flex flex-wrap gap-2">
                  <AcaoRole userId={u.id} role="midia" rotulo="Mídia" outline />
                  <AcaoRole userId={u.id} role="tesouraria" rotulo="Tesouraria" outline />
                  <AcaoRole userId={u.id} role="apostolo" rotulo="Apóstolo(a)" outline />
                  <AcaoRole userId={u.id} role="pendente" rotulo="Remover acesso" outline />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-medium mb-3">
          Mídia ({midias.length})
        </h2>
        {midias.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma pessoa de mídia ainda.</p>
        ) : (
          <ul className="space-y-2">
            {midias.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 border rounded-lg px-4 py-3"
              >
                <span className="text-sm">{u.nome}</span>
                <div className="flex flex-wrap gap-2">
                  <AcaoRole userId={u.id} role="lider" rotulo="Virar líder" outline />
                  <AcaoRole userId={u.id} role="pendente" rotulo="Remover acesso" outline />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
