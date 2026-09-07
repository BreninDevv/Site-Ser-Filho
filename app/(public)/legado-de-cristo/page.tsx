import type { Metadata } from "next";
import Image from "next/image";
import { InscricaoLegadoForm } from "./inscricao-form";

export const metadata: Metadata = {
  title: "Legado de Cristo | Ser Filho",
  description:
    "Inscreva-se no Legado de Cristo da igreja Ser Filho. Um tempo para firmar o que Deus já começou e deixar um rastro de fé.",
};

export default function LegadoDeCristoPage() {
  return (
    <div className="pagina-legado-de-cristo">
      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-8 bg-black">
        <h1 className="sr-only">Legado de Cristo</h1>
        <Image
          src="/legado/hero-mobile.jpg"
          alt="Legado de Cristo"
          width={1024}
          height={1024}
          className="h-auto w-full md:hidden"
          priority
        />
        <Image
          src="/legado/hero.jpg"
          alt="Legado de Cristo"
          width={1920}
          height={1080}
          className="hidden h-auto w-full md:block"
          priority
        />
      </div>

      <section
        className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 bg-black bg-cover bg-center"
        style={{ backgroundImage: "url('/legado/fundo.jpg')" }}
      >
        <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
          <h2 className="font-heading text-4xl uppercase text-[#c6ff00] sm:text-5xl">
            Faça sua inscrição
          </h2>
          <p className="mt-3 mb-8 text-sm leading-relaxed text-white/70">
            Primeiro seus dados, depois o pagamento. A inscrição só é confirmada
            depois que a equipe conferir. Não é preciso ter conta no site.
          </p>
          <div className="border border-white/15 bg-[#faf9f6] p-5 sm:p-7">
            <InscricaoLegadoForm />
          </div>
        </div>
      </section>
    </div>
  );
}
