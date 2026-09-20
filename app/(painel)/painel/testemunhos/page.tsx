import { obterPerfilAtual, podeGerenciarMidia } from "@/lib/auth/permissoes";
import { createClient } from "@/lib/supabase/server";
import { MAX_TESTEMUNHOS } from "@/lib/midia";
import { FormTestemunho } from "./form-testemunho";
import { ItemTestemunho } from "./item-testemunho";

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
          Até {MAX_TESTEMUNHOS} na home. YouTube Shorts: prévia automática.
          Instagram: envie foto ou MP4. Dá para editar ou remover os que já
          estão no ar.
        </p>
      </div>

      {error && (
        <p className="border border-destructive/40 p-4 text-sm text-destructive">
          Não carregou os testemunhos. Rode{" "}
          <code>supabase/migrations/010_testemunhos_reel.sql</code> no Supabase.
        </p>
      )}

      {(testemunhos?.length ?? 0) < MAX_TESTEMUNHOS ? (
        <FormTestemunho />
      ) : (
        <p className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
          Os {MAX_TESTEMUNHOS} Reels já estão no ar. Remova ou edite um abaixo.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium">
          No ar agora ({testemunhos?.length ?? 0} de {MAX_TESTEMUNHOS})
        </h2>
        {!testemunhos?.length ? (
          <p className="text-sm text-muted-foreground">Nenhum vídeo publicado.</p>
        ) : (
          <ul className="space-y-3">
            {testemunhos.map((item) => (
              <ItemTestemunho key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
