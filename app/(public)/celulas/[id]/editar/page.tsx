import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { atualizarCelula } from "../../actions";

export default async function EditarCelulaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: celula } = await supabase
    .from("celulas")
    .select("*")
    .eq("id", id)
    .single();

  if (!celula) notFound();

  let podeEditar = false;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfis")
      .select("role")
      .eq("id", user.id)
      .single();
    podeEditar =
      perfil?.role === "dev" ||
      (perfil?.role === "lider" && celula.lider_id === user.id);
  }

  if (!podeEditar) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para editar esta célula.
        </p>
      </div>
    );
  }

  const atualizarComId = atualizarCelula.bind(null, id);

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-heading text-3xl uppercase mb-8">Editar célula</h1>

      {erro && (
        <p className="mb-4 text-sm text-destructive">
          Não foi possível salvar. Tente de novo.
        </p>
      )}

      <form action={atualizarComId} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Foto da célula</label>
          {celula.foto_url && (
            <img
              src={celula.foto_url}
              alt={celula.nome}
              className="mb-3 h-40 w-full object-cover border border-border"
            />
          )}
          <input
            name="foto"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none file:mr-3 file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-background file:text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {celula.foto_url ? "Deixe em branco para manter a foto atual." : "Opcional. PNG, JPG ou WebP."}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Seu nome</label>
          <input
            name="nome_responsavel"
            defaultValue={celula.nome_responsavel ?? ""}
            required
            placeholder="Nome do líder ou pastor responsável"
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Nome da célula</label>
          <input
            name="nome"
            defaultValue={celula.nome}
            required
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Endereço</label>
          <input
            name="endereco"
            defaultValue={celula.endereco}
            required
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Dia da semana</label>
          <input
            name="dia"
            defaultValue={celula.dia}
            required
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Horário</label>
          <input
            name="horario"
            defaultValue={celula.horario}
            required
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Informações adicionais</label>
          <textarea
            name="descricao"
            defaultValue={celula.descricao ?? ""}
            rows={3}
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-foreground text-background py-2.5 text-sm font-semibold hover:bg-foreground/90"
        >
          Salvar alterações
        </button>
      </form>
    </div>
  );
}