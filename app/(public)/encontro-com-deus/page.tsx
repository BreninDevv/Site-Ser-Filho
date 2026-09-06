import { InscricaoForm } from "./inscricao-form";

export default function EncontroComDeusPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-5xl uppercase">Encontro com Deus</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Um fim de semana para sair da rotina, ouvir a Palavra e começar de novo. Se
        você nunca participou, esse é o seu convite.
      </p>

      <div className="mt-10 border-t border-border pt-10">
        <h2 className="font-heading text-3xl uppercase">Faça sua inscrição</h2>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">
          Primeiro seus dados, depois o pagamento. A inscrição só é confirmada
          depois que a equipe conferir. Não é preciso ter conta no site.
        </p>

        <div className="max-w-xl">
          <InscricaoForm />
        </div>
      </div>
    </div>
  );
}
