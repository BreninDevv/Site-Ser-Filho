import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatarQuando, urlPublicaDoPost } from "@/lib/midia";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Eventos | Ser Filho",
  description: "O que está acontecendo no Ministério Ser Filho.",
};

export default async function EventosPage() {
  const supabase = await createClient();
  const agora = new Date().toISOString();
  const { data: eventos, error } = await supabase
    .from("eventos")
    .select("id, nome, descricao, imagem_path, publicar_em, exige_inscricao")
    .lte("publicar_em", agora)
    .order("publicar_em", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-2 py-8 sm:py-12">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">
        Agenda
      </p>
      <h1 className="font-heading text-5xl font-bold tracking-tight sm:text-6xl">
        Eventos
      </h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
        O que está rolando no Ser Filho. A equipe de mídia atualiza esta página
        sempre que um post novo entra.
      </p>

      {error ? (
        <p className="mt-12 rounded-2xl border border-destructive/40 p-6 text-sm text-destructive">
          Não foi possível carregar os eventos. Rode a migration 009 no
          Supabase.
        </p>
      ) : !eventos?.length ? (
        <p className="mt-12 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum evento no ar neste momento.
        </p>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {eventos.map((evento) => (
            <article
              key={evento.id}
              className="overflow-hidden rounded-2xl bg-white shadow-[0_1rem_2.5rem_rgba(20,20,18,0.08)]"
            >
              <img
                src={urlPublicaDoPost(evento.imagem_path)}
                alt={evento.nome}
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="space-y-2 p-5">
                <p className="text-xs text-muted-foreground">
                  {formatarQuando(evento.publicar_em)}
                </p>
                <h2 className="font-heading text-2xl font-bold tracking-tight">
                  <Link href={`/eventos/${evento.id}`}>{evento.nome}</Link>
                </h2>
                {evento.descricao && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {evento.descricao}
                  </p>
                )}
                {evento.exige_inscricao && (
                  <Button className="mt-3 rounded-full" asChild>
                    <Link href={`/eventos/${evento.id}`}>Inscrever-se</Link>
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
