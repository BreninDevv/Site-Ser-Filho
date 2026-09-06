import { createClient } from "@/lib/supabase/server";
import { podeGerenciarCelulas } from "@/lib/auth/roles";
import { NovaCelulaForm } from "./nova-celula-form";

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
    podeGerenciar = podeGerenciarCelulas(perfil?.role);
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
      <NovaCelulaForm erro={erro} />
    </div>
  );
}