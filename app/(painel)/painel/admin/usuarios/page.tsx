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

function BotoesPromover({
  userId,
  roleAtual,
}: {
  userId: string;
  roleAtual: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {roleAtual !== "lider" && (
        <AcaoRole userId={userId} role="lider" rotulo="Líder" outline={roleAtual !== "pendente" && roleAtual !== "discipulo" && roleAtual !== "membro"} />
      )}
      {roleAtual !== "pastor" && (
        <AcaoRole userId={userId} role="pastor" rotulo="Pastor" outline />
      )}
      {roleAtual !== "midia" && (
        <AcaoRole userId={userId} role="midia" rotulo="Líder de mídia" outline />
      )}
      {roleAtual !== "tesouraria" && (
        <AcaoRole userId={userId} role="tesouraria" rotulo="Tesouraria" outline />
      )}
      {roleAtual !== "apostolo" && (
        <AcaoRole userId={userId} role="apostolo" rotulo="Apóstolo(a)" outline />
      )}
      {roleAtual !== "discipulo" && roleAtual !== "membro" && (
        <AcaoRole userId={userId} role="discipulo" rotulo="Discípulo" outline />
      )}
    </div>
  );
}

function ListaUsuarios({
  titulo,
  vazio,
  pessoas,
  perfilId,
}: {
  titulo: string;
  vazio: string;
  pessoas: {
    id: string;
    nome: string | null;
    role: string;
    tempo_igreja?: string | null;
    equipe?: string | null;
  }[];
  perfilId?: string;
}) {
  return (
    <section>
      <h2 className="text-sm font-medium mb-3">{titulo}</h2>
      {pessoas.length === 0 ? (
        <p className="text-sm text-muted-foreground">{vazio}</p>
      ) : (
        <ul className="space-y-2">
          {pessoas.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 border rounded-lg px-4 py-3"
            >
              <span className="text-sm">
                {u.nome}{" "}
                <span className="text-muted-foreground">
                  ({ROTULOS_ROLE[u.role] ?? u.role})
                  {u.equipe ? ` · ${u.equipe}` : ""}
                  {u.tempo_igreja ? ` · ${u.tempo_igreja}` : ""}
                </span>
              </span>
              {u.role === "dev" || u.id === perfilId ? (
                <span className="text-xs text-muted-foreground">
                  {u.id === perfilId ? "É você" : "Não se altera por aqui"}
                </span>
              ) : (
                <BotoesPromover userId={u.id} roleAtual={u.role} />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
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

  const completo = await supabase
    .from("perfis")
    .select("id, nome, role, created_at, tempo_igreja, equipes_pastorais(nome)")
    .order("created_at", { ascending: false });

  const simples = completo.error
    ? await supabase
        .from("perfis")
        .select("id, nome, role, created_at")
        .order("created_at", { ascending: false })
    : null;

  const usuarios = completo.error ? simples?.data ?? [] : completo.data ?? [];

  const comEquipe = usuarios.map((u) => {
    const extra = u as {
      tempo_igreja?: string | null;
      equipes_pastorais?: { nome: string } | { nome: string }[] | null;
    };
    const rel = extra.equipes_pastorais;
    const equipe = Array.isArray(rel) ? rel[0]?.nome : rel?.nome;
    return {
      id: u.id,
      nome: u.nome,
      role: u.role,
      tempo_igreja: extra.tempo_igreja ?? null,
      equipe: equipe ?? null,
    };
  });

  const pendentes = comEquipe.filter((u) => u.role === "pendente");
  const membros = comEquipe.filter(
    (u) => u.role === "discipulo" || u.role === "membro"
  );
  const lideres = comEquipe.filter((u) => u.role === "lider");
  const pastores = comEquipe.filter((u) => u.role === "pastor");
  const midias = comEquipe.filter((u) => u.role === "midia");
  const masters = comEquipe.filter((u) =>
    ROLES_MASTER.includes(u.role as (typeof ROLES_MASTER)[number])
  );

  return (
    <div className="space-y-10 p-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">Admin · Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Quem se cadastra escolhe a função, a equipe pastoral e o tempo de
          igreja. <strong>Discípulo</strong> fica na base e não entra no painel.
        </p>
        <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Discípulo</strong> — conta na
            base, como visitante. Sem painel.
          </li>
          <li>
            <strong className="text-foreground">Líder</strong> — vê inscrições
            e cuida das células. Sem aprovar pagamento e sem mídia.
          </li>
          <li>
            <strong className="text-foreground">Pastor</strong> — vê inscrições
            e cuida das células. Sem aprovar pagamento e sem mídia.
          </li>
          <li>
            <strong className="text-foreground">Líder de mídia</strong> —
            Eventos e os 3 testemunhos da home.
          </li>
          <li>
            <strong className="text-foreground">Tesouraria</strong> —
            inscrições e pagamento.
          </li>
          <li>
            <strong className="text-foreground">Apóstolo(a)</strong> — painel
            completo.
          </li>
          <li>
            <strong className="text-foreground">Dev</strong> — acesso a tudo.
          </li>
        </ul>
      </div>

      <ListaUsuarios
        titulo={`Discípulos (${membros.length})`}
        vazio="Nenhum discípulo cadastrado ainda."
        pessoas={membros}
        perfilId={perfil?.id}
      />

      {pendentes.length > 0 && (
        <ListaUsuarios
          titulo={`Aguardando aprovação (${pendentes.length})`}
          vazio="Nenhuma solicitação pendente."
          pessoas={pendentes}
          perfilId={perfil?.id}
        />
      )}

      <ListaUsuarios
        titulo={`Líderes (${lideres.length})`}
        vazio="Nenhum líder ativo ainda."
        pessoas={lideres}
        perfilId={perfil?.id}
      />

      <ListaUsuarios
        titulo={`Pastores (${pastores.length})`}
        vazio="Nenhum pastor ativo ainda."
        pessoas={pastores}
        perfilId={perfil?.id}
      />

      <ListaUsuarios
        titulo={`Mídia (${midias.length})`}
        vazio="Nenhuma pessoa de mídia ainda."
        pessoas={midias}
        perfilId={perfil?.id}
      />

      <ListaUsuarios
        titulo={`Acessos master (${masters.length})`}
        vazio="Nenhum acesso master ainda."
        pessoas={masters}
        perfilId={perfil?.id}
      />
    </div>
  );
}
