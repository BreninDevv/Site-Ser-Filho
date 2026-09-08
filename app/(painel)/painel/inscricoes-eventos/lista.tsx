"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BarraExclusaoTesouraria,
  CheckboxInscricao,
} from "@/components/barra-exclusao-tesouraria";
import { ExcluirInscricaoButton } from "@/components/excluir-inscricao-button";
import {
  ROTULOS_FORMA,
  formatarReais,
  type FormaPagamento,
} from "@/lib/validations/pagamento-encontro";
import { type StatusInscricao } from "@/lib/validations/inscricao-encontro";
import { ROTULOS_STATUS_PAGAMENTO } from "@/lib/validations/inscricao-evento";
import {
  aprovarInscricaoEvento,
  definirStatusEvento,
  excluirInscricaoEvento,
  excluirInscricoesEvento,
  excluirTodasInscricoesEvento,
} from "./actions";

export type InscricaoEventoPainel = {
  id: string;
  nome: string;
  idade: number;
  eventoNome: string;
  status: StatusInscricao;
  forma_pagamento: FormaPagamento | null;
  valor_cobrado_centavos: number;
  valor_pago_centavos: number;
  comprovanteUrl: string | null;
  ehPdf: boolean;
  temComprovante: boolean;
  created_at: string;
};

const ROTULOS_STATUS = ROTULOS_STATUS_PAGAMENTO;

export function ListaInscricoesEvento({
  inscricoes,
}: {
  inscricoes: InscricaoEventoPainel[];
}) {
  const [modoSelecao, setModoSelecao] = useState(false);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  if (inscricoes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma inscrição de evento ainda.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <BarraExclusaoTesouraria
        total={inscricoes.length}
        idsVisiveis={inscricoes.map((i) => i.id)}
        modoSelecao={modoSelecao}
        onModoSelecao={setModoSelecao}
        selecionados={selecionados}
        onSelecionados={setSelecionados}
        onApagarSelecionadas={excluirInscricoesEvento}
        onApagarTodas={excluirTodasInscricoesEvento}
      />
      <ul className="space-y-4">
        {inscricoes.map((item) => (
          <li key={item.id} className="rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {modoSelecao && (
                  <div className="mb-2">
                    <CheckboxInscricao
                      id={item.id}
                      marcado={selecionados.includes(item.id)}
                      onChange={(id, marcado) =>
                        setSelecionados((atual) =>
                          marcado
                            ? [...new Set([...atual, id])]
                            : atual.filter((x) => x !== id)
                        )
                      }
                    />
                  </div>
                )}
                <p className="font-semibold">{item.nome}</p>
              <p className="text-sm text-muted-foreground">
                {item.idade} anos · {item.eventoNome}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em]">
                Pagamento: {ROTULOS_STATUS[item.status]}
              </p>
            </div>
            <p className="text-sm">
              {item.forma_pagamento
                ? ROTULOS_FORMA[item.forma_pagamento]
                : "Sem forma"}{" "}
              · {formatarReais(item.valor_cobrado_centavos)}
              {item.valor_pago_centavos > 0
                ? ` · pago ${formatarReais(item.valor_pago_centavos)}`
                : " · ainda não conferido"}
            </p>
          </div>

          {item.temComprovante ? (
            item.comprovanteUrl ? (
              item.ehPdf ? (
                <a
                  href={item.comprovanteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-sm font-semibold underline"
                >
                  Abrir comprovante (PDF)
                </a>
              ) : (
                <a
                  href={item.comprovanteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 block max-w-sm"
                >
                  <img
                    src={item.comprovanteUrl}
                    alt={`Comprovante de ${item.nome}`}
                    className="max-h-56 w-full border border-border object-contain"
                  />
                </a>
              )
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Comprovante enviado. Atualize a página para ver.
              </p>
            )
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Sem comprovante — pagamento presencial.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {item.status === "pendente" && (
              <form action={aprovarInscricaoEvento.bind(null, item.id)}>
                <Button size="sm" type="submit">
                  Aprovar pagamento
                </Button>
              </form>
            )}
            {item.status === "pendente" && (
              <form action={definirStatusEvento.bind(null, item.id, "cancelada")}>
                <Button size="sm" variant="outline" type="submit">
                  Recusar pagamento
                </Button>
              </form>
            )}
            {item.status !== "pendente" && (
              <form action={definirStatusEvento.bind(null, item.id, "pendente")}>
                <Button size="sm" variant="outline" type="submit">
                  Voltar para em análise
                </Button>
              </form>
            )}
            <ExcluirInscricaoButton
              inscricaoId={item.id}
              nome={item.nome}
              action={excluirInscricaoEvento}
            />
          </div>
        </li>
      ))}
    </ul>
    </div>
  );
}
