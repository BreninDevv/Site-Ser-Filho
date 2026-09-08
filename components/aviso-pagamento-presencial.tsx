import { type FormaPagamento } from "@/lib/validations/pagamento-encontro";

export function ehPagamentoPresencial(
  forma: FormaPagamento | "" | null | undefined
) {
  return forma === "dinheiro" || forma === "debito" || forma === "credito";
}

export function AvisoPagamentoPresencial({
  forma,
  contexto = "inscricao",
}: {
  forma: FormaPagamento | "" | null | undefined;
  contexto?: "inscricao" | "complemento";
}) {
  if (!ehPagamentoPresencial(forma)) return null;

  return (
    <div className="border border-[#4b6f36]/40 bg-[#fff8e7] p-4 text-sm leading-relaxed">
      <p className="font-semibold">Pagamento em dinheiro ou cartão</p>
      <p className="mt-1">
        Esse pagamento é presencial, na igreja. A tesouraria confirma depois.{" "}
        {contexto === "complemento"
          ? "Pode enviar o restante normalmente."
          : "Pode enviar a inscrição normalmente."}
      </p>
    </div>
  );
}
