"use client";

import { useActionState } from "react";
import { AvisoStatusRequerConta } from "@/components/aviso-status-cadastro";
import {
  ROTULOS_STATUS_PAGAMENTO,
  TEXTOS_STATUS_PAGAMENTO,
} from "@/lib/validations/inscricao-evento";
import {
  consultarStatusPagamentoEvento,
  ESTADO_INICIAL_CONSULTA,
} from "./actions";

const campo =
  "w-full border border-[#dcdad3] bg-[#faf9f6] px-3 py-2.5 text-sm outline-none focus:border-foreground";

export function ConsultaPagamentoEvento({
  eventoId,
  logado,
}: {
  eventoId: string;
  logado: boolean;
}) {
  const [estado, action, pendente] = useActionState(
    async (
      anterior: Awaited<ReturnType<typeof consultarStatusPagamentoEvento>>,
      formData: FormData
    ) => consultarStatusPagamentoEvento(eventoId, anterior, formData),
    ESTADO_INICIAL_CONSULTA
  );

  return (
    <div className="mt-10 border border-[#dcdad3] bg-[#faf9f6]/94 p-5 sm:p-7">
      <h3 className="font-heading text-2xl font-bold tracking-tight">
        Status do pagamento
      </h3>
      {!logado ? (
        <AvisoStatusRequerConta />
      ) : (
        <>
          <p className="mt-2 mb-5 text-sm text-[#141412]/70">
            Digite o mesmo nome e a mesma idade da inscrição para ver se o
            pagamento está em análise, aprovado ou recusado.
          </p>
          <form action={action} className="space-y-4">
            <div>
              <label htmlFor="consulta-nome" className="mb-1.5 block text-sm font-medium">
                Nome completo
              </label>
              <input
                id="consulta-nome"
                name="nome"
                required
                disabled={pendente}
                className={campo}
              />
            </div>
            <div>
              <label htmlFor="consulta-idade" className="mb-1.5 block text-sm font-medium">
                Idade
              </label>
              <input
                id="consulta-idade"
                name="idade"
                type="number"
                min={1}
                max={120}
                required
                disabled={pendente}
                className={campo}
              />
            </div>
            <button
              type="submit"
              disabled={pendente}
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
            >
              {pendente ? "Consultando..." : "Ver status"}
            </button>
          </form>

          {estado.status === "ok" && (
            <div className="mt-5 border border-[#dcdad3] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#141412]/55">
                Pagamento
              </p>
              <p className="mt-1 text-lg font-semibold">
                {ROTULOS_STATUS_PAGAMENTO[estado.pagamento]}
              </p>
              <p className="mt-1 text-sm text-[#141412]/70">
                {TEXTOS_STATUS_PAGAMENTO[estado.pagamento]}
              </p>
            </div>
          )}
          {estado.status === "vazio" && (
            <p className="mt-4 text-sm text-[#141412]/70">{estado.mensagem}</p>
          )}
          {estado.status === "erro" && (
            <p className="mt-4 text-sm text-destructive">{estado.mensagem}</p>
          )}
        </>
      )}
    </div>
  );
}
