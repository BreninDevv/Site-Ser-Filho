import { Button } from "@/components/ui/button";
import { obterPerfilAtual, podeGerenciarMidia } from "@/lib/auth/permissoes";
import { createClient } from "@/lib/supabase/server";
import { previaEhVideo, urlPublicaDaPrevia } from "@/lib/midia";
import { excluirTestemunho } from "./actions";
import { FormTestemunho } from "./form-testemunho";

export default async function PainelTestemunhosPage() {
  const perfil = await obterPerfilAtual();
  if (!podeGerenciarMidia(perfil)) {
    return (
      <div>
        <h1 className="mb-1 text-xl font-semibold">Testemunhos</h1>
        <p className="text-sm text-muted-foreground">
          Só a equipe de mídia e o acesso master mexem nos vídeos.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: testemunhos, error } = await supabase
    .from("testemunhos")
    .select("id, nome, titulo, descricao, video_url, previa_path, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Testemunhos</h1>
        <p className="text-sm text-muted-foreground">
          Só 3 Reels na home. Envie a prévia, a descrição e o link do Instagram
          ou do YouTube. Para trocar, remova um e publique o novo.
        </p>
      </div>

      {error && (
        <p className="border border-destructive/40 p-4 text-sm text-destructive">
          Não carregou os testemunhos. Rode{" "}
          <code>supabase/migrations/010_testemunhos_reel.sql</code> no Supabase.
        </p>
      )}

      {(testemunhos?.length ?? 0) < 3 ? (
        <FormTestemunho />
      ) : (
        <p className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
          Os 3 Reels já estão no ar. Remova um abaixo para publicar outro.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium">
          No ar agora ({testemunhos?.length ?? 0} de 3)
        </h2>
        {!testemunhos?.length ? (
          <p className="text-sm text-muted-foreground">Nenhum vídeo publicado.</p>
        ) : (
          <ul className="space-y-3">
            {testemunhos.map((item) => {
              const previa = item.previa_path
                ? urlPublicaDaPrevia(item.previa_path)
                : "";
              return (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-border p-4"
                >
                  <div className="flex min-w-0 gap-3">
                    {previa ? (
                      <div className="h-24 w-14 shrink-0 overflow-hidden rounded-md bg-black">
                        {item.previa_path && previaEhVideo(item.previa_path) ? (
                          <video
                            src={previa}
                            muted
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previa}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {item.nome || item.titulo}
                      </p>
                      {item.descricao ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {item.descricao}
                        </p>
                      ) : null}
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {item.video_url}
                      </p>
                    </div>
                  </div>
                  <form action={excluirTestemunho.bind(null, item.id)}>
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
