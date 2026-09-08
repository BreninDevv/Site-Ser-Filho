import Link from "next/link";

export function AvisoStatusCadastro({
  logado,
  className,
}: {
  logado: boolean;
  className?: string;
}) {
  if (logado) return null;

  return (
    <div
      className={
        className ??
        "border border-[#dcdad3] bg-[#fff8e7] p-4 text-sm leading-relaxed text-[#141412]"
      }
    >
      <p className="font-semibold">Inscrição como visitante</p>
      <p className="mt-1 text-[#141412]/80">
        Dá para se inscrever sem conta. O status do pagamento (em análise,
        aprovado ou recusado) só aparece se você{" "}
        <Link href="/cadastro" className="font-semibold underline underline-offset-2">
          criar uma conta
        </Link>{" "}
        e{" "}
        <Link href="/login" className="font-semibold underline underline-offset-2">
          entrar no site
        </Link>
        .
      </p>
    </div>
  );
}

export function AvisoStatusRequerConta() {
  return (
    <>
      <p className="mt-2 mb-5 text-sm leading-relaxed text-[#141412]/70">
        Só é possível ver se o pagamento está em análise, aprovado ou recusado
        se você criar uma conta e entrar no site.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/cadastro"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background"
        >
          Criar conta
        </Link>
        <Link
          href="/login"
          className="rounded-full border border-[#dcdad3] px-5 py-2.5 text-sm font-semibold"
        >
          Entrar
        </Link>
      </div>
    </>
  );
}
