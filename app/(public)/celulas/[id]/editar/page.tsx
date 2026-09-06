import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eAcessoMaster } from "@/lib/auth/roles";
import { EditarCelulaForm } from "./editar-celula-form";

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
      eAcessoMaster(perfil?.role) ||
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

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="font-heading text-3xl uppercase mb-8">Editar célula</h1>
      <EditarCelulaForm celula={celula} erro={erro} />
    </div>
  );
}