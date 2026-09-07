import { Button } from "@/components/ui/button";
import { obterPerfilAtual, podeGerenciarMidia } from "@/lib/auth/permissoes";
import { createClient } from "@/lib/supabase/server";
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
    .select("id, nome, video_url, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Testemunhos</h1>
        <p className="text-sm text-muted-foreground">
          Só 3 shorts na home. Cole o link do Reels ou do YouTube Shorts.
          Para trocar, remova um e publique o novo. O “ver mais” vai para o
          Instagram da igreja.
        </p>
      </div>

      {error && (
        <p className="border border-destructive/40 p-4 text-sm text-destructive">
          Não carregou os testemunhos. Rode{" "}
          <code>supabase/migrations/005_eventos_e_midia.sql</code> no Supabase.
        </p>
      )}

      {(testemunhos?.length ?? 0) < 3 ? (
        <FormTestemunho />
      ) : (
        <p className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
          Os 3 vídeos já estão no ar. Remova um abaixo para publicar outro.
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
            {testemunhos.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4"
              >
                <div>
                  <p className="text-sm font-semibold">{item.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.video_url}
                  </p>
                </div>
                <form action={excluirTestemunho.bind(null, item.id)}>
                  <Button size="sm" variant="destructive" type="submit">
                    Remover
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
