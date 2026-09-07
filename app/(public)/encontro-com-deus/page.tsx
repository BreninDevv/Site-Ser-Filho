import type { Metadata } from "next";
import Image from "next/image";
import { InscricaoForm } from "./inscricao-form";

export const metadata: Metadata = {
  title: "Encontro de Volta ao Jardim | Ser Filho",
  description:
    "Inscreva-se no Encontro de Volta ao Jardim da igreja Ser Filho. Um fim de semana para sair da rotina, ouvir a Palavra e começar de novo.",
};

export default function EncontroComDeusPage() {
  return (
    <div className="pagina-volta-ao-jardim">
      <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-8 bg-[#1f3d1f]">
        <h1 className="sr-only">Encontro de Volta ao Jardim</h1>
        <Image
          src="/encontro/hero-mobile.jpg"
          alt="Encontro de Volta ao Jardim"
          width={1024}
          height={1024}
          className="h-auto w-full md:hidden"
          priority
        />
        <Image
          src="/encontro/hero.jpg"
          alt="Encontro de Volta ao Jardim"
          width={1920}
          height={1080}
          className="hidden h-auto w-full md:block"
          priority
        />
      </div>

      <section
        className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 bg-[#faf9f6] bg-cover bg-center"
        style={{ backgroundImage: "url('/encontro/fundo.jpg')" }}
      >
        <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
          <h2 className="font-heading text-4xl uppercase text-[#4b6f36] sm:text-5xl">
            Faça sua inscrição
          </h2>
          <p className="mt-3 mb-8 text-sm leading-relaxed text-[#141412]/75">
            Primeiro seus dados, depois o pagamento. A inscrição só é confirmada
            depois que a equipe conferir. Não é preciso ter conta no site.
          </p>
          <div className="border border-[#dcdad3] bg-[#faf9f6]/92 p-5 sm:p-7">
            <InscricaoForm />
          </div>
        </div>
      </section>
    </div>
  );
}
