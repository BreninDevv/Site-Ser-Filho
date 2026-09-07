import Link from "next/link";
import { Button } from "@/components/ui/button";
import { obterPerfilAtual, podeGerenciarMidia } from "@/lib/auth/permissoes";
import { createClient } from "@/lib/supabase/server";
import {
  eventoNoAr,
  formatarQuando,
  urlPublicaDoPost,
} from "@/lib/midia";
import { excluirEvento } from "./actions";
import { FormEvento } from "./form-evento";

export default async function PainelEventosPage() {
  const perfil = await obterPerfilAtual();
  if (!podeGerenciarMidia(perfil)) {
    return (
      <div>
        <h1 className="mb-1 text-xl font-semibold">Eventos</h1>
        <p className="text-sm text-muted-foreground">
          Só a equipe de mídia e o acesso master mexem nos eventos.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: eventos, error } = await supabase
    .from("eventos")
    .select("id, nome, descricao, imagem_path, publicar_em, exige_inscricao, valor_centavos, created_at")
    .order("publicar_em", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Eventos</h1>
        <p className="text-sm text-muted-foreground">
          Publique agora, programe para depois ou edite um post que já está no
          ar.
        </p>
      </div>

      {error && (
        <p className="border border-destructive/40 p-4 text-sm text-destructive">
          Não carregou os eventos. Rode{" "}
          <code>supabase/migrations/009_inscricoes_evento.sql</code> no
          Supabase.
        </p>
      )}

      <FormEvento />

      <section className="space-y-3">
        <h2 className="text-sm font-medium">
          Posts ({eventos?.length ?? 0})
        </h2>
        {!eventos?.length ? (
          <p className="text-sm text-muted-foreground">Nenhum evento ainda.</p>
        ) : (
          <ul className="space-y-3">
            {eventos.map((evento) => {
              const noAr = eventoNoAr(evento.publicar_em);
              return (
                <li
                  key={evento.id}
                  className="flex items-center gap-4 rounded-2xl border border-border p-3"
                >
                  <img
                    src={urlPublicaDoPost(evento.imagem_path)}
                    alt={evento.nome}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{evento.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {noAr
                        ? `No ar · ${formatarQuando(evento.publicar_em)}`
                        : `Programado · ${formatarQuando(evento.publicar_em)}`}
                      {evento.exige_inscricao ? " · Com inscrição" : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/painel/eventos/${evento.id}`}>Editar</Link>
                  </Button>
                  <form action={excluirEvento.bind(null, evento.id)}>
                    <Button size="sm" variant="destructive" type="submit">
                      Remover
                    </Button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
