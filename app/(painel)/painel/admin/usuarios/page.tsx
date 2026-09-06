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
  const lideres = usuarios?.filter((u) => u.role === "lider") ?? [];
  const masters = usuarios?.filter((u) =>
    ROLES_MASTER.includes(u.role as (typeof ROLES_MASTER)[number])
  ) ?? [];

  return (
    <div className="space-y-10 p-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">Admin · Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Tesouraria e Apóstolo(a) têm o mesmo acesso do Dev. Líder só vê as
          inscrições do Encontro, sem aprovar pagamento.
        </p>
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
                  <AcaoRole userId={u.id} role="tesouraria" rotulo="Tesouraria" outline />
                  <AcaoRole userId={u.id} role="apostolo" rotulo="Apóstolo(a)" outline />
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
