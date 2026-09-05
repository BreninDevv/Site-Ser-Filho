import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function PainelDashboardPage() {
  const supabase = await createClient();

  const { count: totalCelulas } = await supabase
    .from("celulas")
    .select("*", { count: "exact", head: true });

  const { count: totalLideres } = await supabase
    .from("perfis")
    .select("*", { count: "exact", head: true })
    .eq("role", "lider");

  const { count: totalPendentes } = await supabase
    .from("perfis")
    .select("*", { count: "exact", head: true })
    .eq("role", "pendente");

  const { data: ultimasCelulas } = await supabase
    .from("celulas")
    .select("id, nome, dia, horario")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="p-8 space-y-10">
      <div>
        <h1 className="font-heading text-3xl uppercase mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumo geral do ministério.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
        <div className="bg-background p-6">
          <p className="text-3xl font-bold">{totalCelulas ?? 0}</p>
          <p className="text-sm text-muted-foreground">Células ativas</p>
        </div>
        <div className="bg-background p-6">
          <p className="text-3xl font-bold">{totalLideres ?? 0}</p>
          <p className="text-sm text-muted-foreground">Líderes/pastores</p>
        </div>
        <div className="bg-background p-6">
          <p className="text-3xl font-bold">{totalPendentes ?? 0}</p>
          <p className="text-sm text-muted-foreground">Aguardando aprovação</p>
        </div>
      </div>

      {totalPendentes && totalPendentes > 0 ? (
        <div className="border border-border p-5 flex items-center justify-between">
          <p className="text-sm">
            Você tem <strong>{totalPendentes}</strong> conta(s) aguardando aprovação.
          </p>
          <Button size="sm" asChild>
            <Link href="/painel/admin/usuarios">Revisar agora</Link>
          </Button>
        </div>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold mb-4">Últimas células cadastradas</h2>
        {!ultimasCelulas || ultimasCelulas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma célula cadastrada ainda.</p>
        ) : (
          <div className="border-t border-border">
            {ultimasCelulas.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between border-b border-border py-4"
              >
                <span className="font-medium">{c.nome}</span>
                <span className="text-sm text-muted-foreground">
                  {c.dia} · {c.horario}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6">
          <Button variant="outline" asChild>
            <Link href="/celulas">Ver todas as células</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}