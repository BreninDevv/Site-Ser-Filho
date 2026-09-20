import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatarQuando, urlPublicaDoPost } from "@/lib/midia";
import { EventosHome } from "@/components/eventos-home";

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

  const itens =
    eventos?.map((evento) => ({
      id: evento.id,
      nome: evento.nome,
      descricao: evento.descricao ?? "",
      data: formatarQuando(evento.publicar_em),
      imagem: urlPublicaDoPost(evento.imagem_path),
      exigeInscricao: Boolean(evento.exige_inscricao),
    })) ?? [];

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="rounded-2xl border border-destructive/40 p-6 text-sm text-destructive">
          Não foi possível carregar os eventos. Rode a migration 009 no
          Supabase.
        </p>
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-tertiary">
          Agenda
        </p>
        <h1 className="font-heading text-5xl font-bold tracking-tight">
          Eventos
        </h1>
        <p className="mt-12 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum evento no ar neste momento. Confira se a data de publicação já
          passou.
        </p>
      </div>
    );
  }

  return (
    <EventosHome
      itens={itens}
      tituloComo="h1"
      mostrarVerTodos={false}
      suporte="O que está rolando no Ser Filho. A equipe de mídia atualiza esta página sempre que um post novo entra."
    />
  );
}
