import {
  obterPerfilAtual,
  podeGerenciarUnicasMidia,
} from "@/lib/auth/permissoes";
import { createClient } from "@/lib/supabase/server";
import { MAX_MIDIA_UNICAS } from "@/lib/midia";
import { FormMidiaUnicas } from "./form-midia";
import { ItemMidiaUnicas } from "./item-midia";

export default async function PainelUnicasMidiaPage() {
  const perfil = await obterPerfilAtual();
  if (!podeGerenciarUnicasMidia(perfil)) {
    return (
      <div>
        <h1 className="mb-1 text-xl font-semibold">Mídia Únicas</h1>
        <p className="text-sm text-muted-foreground">
          Só líder, pastor, mídia e acesso master mexem nas fotos e vídeos.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: itens, error } = await supabase
    .from("midia_unicas")
    .select("id, titulo, subtitulo, arquivo_path, tipo, ordem, created_at")
    .order("ordem", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Mídia Únicas</h1>
        <p className="text-sm text-muted-foreground">
          Até {MAX_MIDIA_UNICAS} fotos ou vídeos no acordeão da página Únicas.
          Aparecem na ordem definida abaixo.
        </p>
      </div>

      {error ? (
        <p className="border border-destructive/40 p-4 text-sm text-destructive">
          Não carregou a galeria. Rode{" "}
          <code>supabase/migrations/029_midia_unicas.sql</code> no Supabase.
        </p>
      ) : null}

      {(itens?.length ?? 0) < MAX_MIDIA_UNICAS ? (
        <FormMidiaUnicas />
      ) : (
        <p className="rounded-2xl border border-border p-4 text-sm text-muted-foreground">
          Os {MAX_MIDIA_UNICAS} itens já estão no ar. Remova ou edite um abaixo.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium">
          No ar agora ({itens?.length ?? 0} de {MAX_MIDIA_UNICAS})
        </h2>
        {!itens?.length ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma foto ou vídeo publicado.
          </p>
        ) : (
          <ul className="space-y-3">
            {itens.map((item) => (
              <ItemMidiaUnicas key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
