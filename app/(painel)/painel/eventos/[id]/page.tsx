import Link from "next/link";
import { notFound } from "next/navigation";
import { obterPerfilAtual, podeGerenciarMidia } from "@/lib/auth/permissoes";
import { createClient } from "@/lib/supabase/server";
import { uuidValido } from "@/lib/seguranca";
import { urlPublicaDoPost } from "@/lib/midia";
import { FormEditarEvento } from "../form-evento";

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const perfil = await obterPerfilAtual();

  if (!podeGerenciarMidia(perfil) || !uuidValido(id)) notFound();

  const supabase = await createClient();
  const { data: evento } = await supabase
    .from("eventos")
    .select("id, nome, descricao, imagem_path, publicar_em, exige_inscricao, valor_centavos")
    .eq("id", id)
    .single();

  if (!evento) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="mb-2 text-sm">
          <Link href="/painel/eventos" className="text-muted-foreground underline">
            Voltar aos eventos
          </Link>
        </p>
        <h1 className="mb-1 text-xl font-semibold">Editar evento</h1>
        <p className="text-sm text-muted-foreground">
          Troque o texto, a data de publicação ou a imagem do post.
        </p>
      </div>

      <img
        src={urlPublicaDoPost(evento.imagem_path)}
        alt={evento.nome}
        className="max-h-72 w-full rounded-2xl object-cover"
      />

      <FormEditarEvento evento={evento} />
    </div>
  );
}
