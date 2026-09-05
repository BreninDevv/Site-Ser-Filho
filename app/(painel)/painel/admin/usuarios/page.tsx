import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { promoverParaLider, rebaixarParaPendente } from "./actions";

export default async function AdminUsuariosPage() {
  const supabase = await createClient();

  const { data: usuarios } = await supabase
    .from("perfis")
    .select("id, nome, role, created_at")
    .order("created_at", { ascending: false });

  const pendentes = usuarios?.filter((u) => u.role === "pendente") ?? [];
  const lideres = usuarios?.filter((u) => u.role === "lider") ?? [];

  return (
    <div className="space-y-10 p-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">Admin · Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Promova quem você reconhece como líder/pastor da igreja.
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
                className="flex items-center justify-between border rounded-lg px-4 py-3"
              >
                <span className="text-sm">{u.nome}</span>
                <form action={promoverParaLider.bind(null, u.id)}>
                  <Button size="sm" type="submit">Promover a líder</Button>
                </form>
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
                className="flex items-center justify-between border rounded-lg px-4 py-3"
              >
                <span className="text-sm">{u.nome}</span>
                <form action={rebaixarParaPendente.bind(null, u.id)}>
                  <Button size="sm" variant="outline" type="submit">
                    Remover acesso de líder
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}