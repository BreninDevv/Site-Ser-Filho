import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { excluirCelula } from "./actions";
import { ExcluirCelulaButton } from "@/components/excluir-celula-button";

export default async function CelulasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfis")
      .select("role")
      .eq("id", user.id)
      .single();
    role = perfil?.role ?? null;
  }

  const podeGerenciar = role === "dev" || role === "lider";

  const { data: celulas } = await supabase
    .from("celulas")
    .select("id, nome, endereco, dia, horario, descricao, lider_id, foto_url, nome_responsavel")
    .order("created_at", { ascending: false });

  function podeEditarOuExcluir(liderId: string) {
    if (role === "dev") return true;
    if (role === "lider" && user && liderId === user.id) return true;
    return false;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-2 flex items-end justify-between">
        <h1 className="font-heading text-5xl uppercase">Células</h1>
        {podeGerenciar && (
          <Button className="bg-foreground text-background hover:bg-foreground/90" asChild>
            <Link href="/celulas/nova">Adicionar célula</Link>
          </Button>
        )}
      </div>
      <p className="mb-10 text-sm text-muted-foreground">
        Encontre uma célula perto de você e participe.
      </p>

      {!celulas || celulas.length === 0 ? (
        <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhuma célula cadastrada ainda.
        </p>
      ) : (
        <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
          {celulas.map((c) => {
            const podeEditar = podeEditarOuExcluir(c.lider_id);
            return (
              <div key={c.id} className="flex flex-col bg-background">
                <div className="aspect-video w-full bg-muted flex items-center justify-center">
                  {c.foto_url ? (
                    <img
                      src={c.foto_url}
                      alt={c.nome}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="1" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col gap-2 p-6">
                  <h2 className="text-lg font-bold">{c.nome}</h2>
                  <p className="text-sm text-muted-foreground">{c.endereco}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.dia} · {c.horario}
                  </p>
                  {c.descricao && <p className="text-sm">{c.descricao}</p>}
                  {c.nome_responsavel && (
                    <p className="text-xs font-medium text-muted-foreground">
                      Responsável: {c.nome_responsavel}
                    </p>
                  )}

                  {podeEditar && (
                    <div className="flex gap-2 border-t border-border pt-4 mt-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/celulas/${c.id}/editar`}>Editar</Link>
                      </Button>
                      <ExcluirCelulaButton
                        celulaId={c.id}
                        celulaNome={c.nome}
                        action={excluirCelula}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}