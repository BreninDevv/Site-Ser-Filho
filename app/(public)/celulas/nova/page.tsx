import { createClient } from "@/lib/supabase/server";
import { criarCelula } from "./actions";

export default async function NovaCelulaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let podeGerenciar = false;
  if (user) {
    const { data: perfil } = await supabase
      .from("perfis")
      .select("role")
      .eq("id", user.id)
      .single();
    podeGerenciar = perfil?.role === "dev" || perfil?.role === "lider";
  }

  if (!podeGerenciar) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <p className="text-sm text-muted-foreground">
          Apenas líderes e pastores podem adicionar células.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-heading text-3xl uppercase mb-8">Nova célula</h1>

      {erro && (
        <p className="mb-4 text-sm text-destructive">
          Não foi possível salvar. Verifique os dados e tente de novo.
        </p>
      )}

      <form action={criarCelula} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Foto da célula</label>
          <input
            name="foto"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none file:mr-3 file:border-0 file:bg-foreground file:px-3 file:py-1.5 file:text-background file:text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">Opcional. PNG, JPG ou WebP.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Seu nome</label>
          <input
            name="nome_responsavel"
            required
            placeholder="Nome do líder ou pastor responsável"
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Nome da célula</label>
          <input
            name="nome"
            required
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Endereço</label>
          <input
            name="endereco"
            required
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Dia da semana</label>
          <input
            name="dia"
            required
            placeholder="Ex: Quinta-feira"
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Horário</label>
          <input
            name="horario"
            required
            placeholder="Ex: 20:00"
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Informações adicionais</label>
          <textarea
            name="descricao"
            rows={3}
            className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-foreground text-background py-2.5 text-sm font-semibold hover:bg-foreground/90"
        >
          Salvar célula
        </button>
      </form>
    </div>
  );
}