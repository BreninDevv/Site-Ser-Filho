import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { urlPublicaDoPost } from "@/lib/midia";

export const metadata: Metadata = {
  title: "Eventos | Ser Filho",
  description: "O que está acontecendo no Ministério Ser Filho.",
};

export default async function EventosPage() {
  const supabase = await createClient();
  const { data: eventos } = await supabase
    .from("eventos")
    .select("id, nome, imagem_path")
    .order("created_at", { ascending: false });

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

      {!eventos?.length ? (
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
              <div className="p-5">
                <h2 className="font-heading text-2xl font-bold tracking-tight">
                  {evento.nome}
                </h2>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
