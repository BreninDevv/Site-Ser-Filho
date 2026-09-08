import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatarQuando, urlPublicaDoPost } from "@/lib/midia";
import { uuidValido } from "@/lib/seguranca";
import { ConsultaPagamentoEvento } from "./consulta-pagamento";
import { InscricaoEventoForm } from "./inscricao-evento-form";

export default async function EventoPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidValido(id)) notFound();

  const supabase = await createClient();
  const agora = new Date().toISOString();
  const [{ data: evento }, { data: auth }] = await Promise.all([
    supabase
      .from("eventos")
      .select("id, nome, descricao, imagem_path, publicar_em, exige_inscricao, valor_centavos")
      .eq("id", id)
      .lte("publicar_em", agora)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (!evento) notFound();

  const logado = Boolean(auth.user);
  const imagem = urlPublicaDoPost(evento.imagem_path);

  return (
    <div>
      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-8 bg-[#141412]">
        <img
          src={imagem}
          alt={evento.nome}
          className="mx-auto h-auto w-full max-w-lg object-contain md:max-w-xl"
        />
      </div>

      <section
        className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 bg-[#faf9f6] bg-cover bg-center"
        style={imagem ? { backgroundImage: `url("${imagem}")` } : undefined}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[#faf9f6]/72"
        />
        <div className="relative mx-auto max-w-xl px-4 py-12 sm:py-16">
          <p className="mb-6 text-sm">
            <Link href="/eventos" className="text-[#141412]/70 underline">
              Voltar aos eventos
            </Link>
          </p>
          <p className="text-xs text-[#141412]/60">
            {formatarQuando(evento.publicar_em)}
          </p>
          <h1 className="font-heading mt-2 text-4xl font-bold tracking-tight">
            {evento.nome}
          </h1>
          {evento.descricao && (
            <p className="mt-3 text-sm leading-relaxed text-[#141412]/75">
              {evento.descricao}
            </p>
          )}

          {evento.exige_inscricao ? (
            <>
              <h2 className="font-heading mt-8 mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Faça sua inscrição
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-[#141412]/75">
                Nome, idade e pagamento. A inscrição só é confirmada depois que
                a tesouraria conferir. Dá para se inscrever como visitante. O
                status do pagamento só aparece para quem tem conta no site.
              </p>
              <div className="border border-[#dcdad3] bg-[#faf9f6]/94 p-5 sm:p-7">
                <InscricaoEventoForm
                  eventoId={evento.id}
                  valorCentavos={evento.valor_centavos}
                  logado={logado}
                />
              </div>
              <ConsultaPagamentoEvento eventoId={evento.id} logado={logado} />
            </>
          ) : (
            <p className="mt-8 text-sm text-[#141412]/70">
              Este evento não precisa de inscrição.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
