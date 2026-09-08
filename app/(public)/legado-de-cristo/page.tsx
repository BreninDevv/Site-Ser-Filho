import type { Metadata } from "next";
import Image from "next/image";
import { StatusPagamentoPorEmail } from "@/components/status-pagamento-conta";
import { createClient } from "@/lib/supabase/server";
import { InscricaoLegadoForm } from "./inscricao-form";

export const metadata: Metadata = {
  title: "Legado de Cristo | Ser Filho",
  description:
    "Inscreva-se no Legado de Cristo da igreja Ser Filho. Um tempo para firmar o que Deus já começou e deixar um rastro de fé.",
};

export default async function LegadoDeCristoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const logado = Boolean(user);

  return (
    <div className="pagina-legado-de-cristo">
      <div className="relative w-full bg-black">
        <h1 className="sr-only">Legado de Cristo</h1>
        <Image
          src="/legado/hero-mobile.jpg"
          alt="Legado de Cristo"
          width={1024}
          height={1024}
          className="block h-auto w-full max-w-full md:hidden"
          priority
        />
        <Image
          src="/legado/hero.jpg"
          alt="Legado de Cristo"
          width={1920}
          height={1080}
          className="hidden h-auto w-full max-w-full md:block"
          priority
        />
      </div>

      <section
        className="relative w-full bg-black bg-cover bg-center"
        style={{ backgroundImage: "url('/legado/fundo.jpg')" }}
      >
        <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
          <h2 className="font-heading text-4xl uppercase text-[#c6ff00] sm:text-5xl">
            Faça sua inscrição
          </h2>
          <p className="mt-3 mb-8 text-sm leading-relaxed text-white/70">
            Primeiro seus dados, depois o pagamento. A inscrição só é confirmada
            depois que a equipe conferir. Dá para se inscrever como visitante. O
            status do pagamento só aparece para quem tem conta no site.
          </p>
          <div className="border border-white/15 bg-[#faf9f6] p-5 sm:p-7">
            <InscricaoLegadoForm logado={logado} />
          </div>
          <StatusPagamentoPorEmail rpc="status_pagamento_legado" />
        </div>
      </section>
    </div>
  );
}
