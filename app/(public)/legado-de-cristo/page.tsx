import { InscricaoLegadoForm } from "./inscricao-form";

export default function LegadoDeCristoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-5xl uppercase">Legado de Cristo</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Um tempo para firmar o que Deus já começou em você. O Legado de Cristo é
        para quem quer continuar, crescer e deixar um rastro de fé na família e
        na igreja.
      </p>

      <div className="mt-10 border-t border-border pt-10">
        <h2 className="font-heading text-3xl uppercase">Faça sua inscrição</h2>
        <p className="mt-2 mb-8 text-sm text-muted-foreground">
          Primeiro seus dados, depois o pagamento. A inscrição só é confirmada
          depois que a equipe conferir. Não é preciso ter conta no site.
        </p>

        <div className="max-w-xl">
          <InscricaoLegadoForm />
        </div>
      </div>
    </div>
  );
}
