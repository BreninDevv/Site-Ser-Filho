"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FORMAS_PAGAMENTO,
  MAX_PARCELAS,
  ROTULOS_FORMA,
  type FormaPagamento,
} from "@/lib/validations/pagamento-legado";
import { atualizarPagamento } from "./actions";

export function EditarPagamentoForm({
  inscricaoId,
  formaInicial,
  parcelasInicial,
  primeiroLegadoInicial,
  valorPagoCentavos,
  observacaoInicial,
}: {
  inscricaoId: string;
  formaInicial: FormaPagamento | null;
  parcelasInicial: number | null;
  primeiroLegadoInicial: boolean;
  valorPagoCentavos: number;
  observacaoInicial: string | null;
}) {
  const [aberto, setAberto] = useState(false);
  const [forma, setForma] = useState<FormaPagamento>(formaInicial ?? "pix");

  if (!aberto) {
    return (
      <Button size="sm" variant="outline" type="button" onClick={() => setAberto(true)}>
        Editar pagamento
      </Button>
    );
  }

  const valorInicial = (valorPagoCentavos / 100).toFixed(2).replace(".", ",");

  return (
    <form
      action={atualizarPagamento.bind(null, inscricaoId)}
      className="mt-3 w-full space-y-3 border border-border p-4"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1.5 block font-medium">Forma</span>
          <select
            name="forma_pagamento"
            value={forma}
            onChange={(e) => setForma(e.target.value as FormaPagamento)}
            className="w-full border border-border bg-background px-3 py-2 text-sm"
          >
            {FORMAS_PAGAMENTO.map((opcao) => (
              <option key={opcao} value={opcao}>
                {ROTULOS_FORMA[opcao]}
              </option>
            ))}
          </select>
        </label>

        {forma === "credito" && (
          <label className="text-sm">
            <span className="mb-1.5 block font-medium">Parcelas</span>
            <select
              name="parcelas"
              defaultValue={parcelasInicial ?? 1}
              className="w-full border border-border bg-background px-3 py-2 text-sm"
            >
              {Array.from({ length: MAX_PARCELAS }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n === 1 ? "À vista" : `${n}x`}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="text-sm">
          <span className="mb-1.5 block font-medium">Primeiro Legado</span>
          <select
            name="primeiro_legado"
            defaultValue={primeiroLegadoInicial ? "sim" : "nao"}
            className="w-full border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="sim">Sim</option>
            <option value="nao">Não</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1.5 block font-medium">Quanto entrou (R$)</span>
          <input
            name="valor_pago"
            inputMode="decimal"
            defaultValue={valorInicial}
            className="w-full border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      </div>

      <p className="text-xs text-muted-foreground">
        Ao salvar, o devido e o valor declarado são recalculados (entrada ou
        total, com taxa se for crédito parcelado).
      </p>

      <label className="block text-sm">
        <span className="mb-1.5 block font-medium">Nota interna (opcional)</span>
        <textarea
          name="pagamento_observacao"
          rows={2}
          defaultValue={observacaoInicial ?? ""}
          className="w-full border border-border bg-background px-3 py-2 text-sm"
        />
      </label>

      <div className="flex gap-2">
        <Button size="sm" type="submit">
          Salvar
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={() => setAberto(false)}>
          Fechar
        </Button>
      </div>
    </form>
  );
}
