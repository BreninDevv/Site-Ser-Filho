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
  if (forma === "dinheiro") {
    return (
      <div className="border border-[#4b6f36]/40 bg-[#fff8e7] p-4 text-sm leading-relaxed">
        <p className="font-semibold">Pagamento em dinheiro</p>
        <p className="mt-1">
          Dirija-se à mesa de inscrição e solicite a aprovação à{" "}
          <strong>Líder/Tesouraria</strong> ou à <strong>Tesouraria</strong>.{" "}
          {contexto === "complemento"
            ? "O restante só entra depois dessa confirmação."
            : "A inscrição fica em análise até a equipe confirmar o pagamento."}
        </p>
      </div>
    );
  }

  if (forma === "debito" || forma === "credito") {
    return (
      <div className="border border-[#4b6f36]/40 bg-[#fff8e7] p-4 text-sm leading-relaxed">
        <p className="font-semibold">Pagamento no cartão</p>
        <p className="mt-1">
          Pague na maquininha da igreja e anexe a foto do comprovante da
          máquina. A tesouraria (ou Líder/Tesouraria) confere depois.
        </p>
      </div>
    );
  }

  return null;
}
