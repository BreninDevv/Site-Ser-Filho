"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ROTULOS_SEXO } from "@/lib/validations/inscricao-encontro";
import { formatarReais } from "@/lib/validations/pagamento-encontro";
import {
  marcarChegadaPlanilha,
  type FontePlanilha,
} from "./actions";

export type LinhaPlanilhaPorta = {
  id: string;
  nome: string;
  sexo: string | null;
  forma: string;
  pagoCentavos: number;
  devidoCentavos: number;
  status: string;
  presente: boolean;
  detalhe?: string;
};

type FiltroSexo = "todos" | "masculino" | "feminino";

function rotuloSexo(sexo: string | null) {
  if (sexo === "masculino" || sexo === "feminino" || sexo === "outro") {
    return ROTULOS_SEXO[sexo];
  }
  return "Não informado";
}

function rotuloStatus(status: string) {
  if (status === "confirmada") return "Pago / confirmado";
  if (status === "pendente") return "Em análise";
  if (status === "cancelada") return "Recusado";
  return status;
}

function escaparCsv(valor: string) {
  if (/[",;\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

function baixarExcel(linhas: LinhaPlanilhaPorta[], titulo: string) {
  const cabecalho = [
    "Nome",
    "Sexo",
    "Forma de pagamento",
    "Valor pago",
    "Valor devido",
    "Status",
    "Chegou (OK)",
    "Detalhe",
  ];
  const corpo = linhas.map((l) =>
    [
      l.nome,
      rotuloSexo(l.sexo),
      l.forma,
      (l.pagoCentavos / 100).toFixed(2).replace(".", ","),
      (l.devidoCentavos / 100).toFixed(2).replace(".", ","),
      rotuloStatus(l.status),
      l.presente ? "Sim" : "Não",
      l.detalhe ?? "",
    ]
      .map((c) => escaparCsv(String(c)))
      .join(";")
  );

  const csv = "\uFEFF" + [cabecalho.join(";"), ...corpo].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const data = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${titulo.replace(/\s+/g, "-").toLowerCase()}-${data}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PlanilhaPorta({
  fonte,
  titulo,
  linhas,
}: {
  fonte: FontePlanilha;
  titulo: string;
  linhas: LinhaPlanilhaPorta[];
}) {
  const [busca, setBusca] = useState("");
  const [filtroSexo, setFiltroSexo] = useState<FiltroSexo>("todos");
  const [pending, startTransition] = useTransition();

  const visiveis = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return linhas
      .filter((l) => l.status !== "cancelada")
      .filter((l) => {
        if (filtroSexo === "todos") return true;
        return l.sexo === filtroSexo;
      })
      .filter((l) => (texto ? l.nome.toLowerCase().includes(texto) : true))
      .sort((a, b) => {
        if (a.presente !== b.presente) return a.presente ? 1 : -1;
        return a.nome.localeCompare(b.nome, "pt-BR");
      });
  }, [busca, filtroSexo, linhas]);

  const homens = visiveis.filter((l) => l.sexo === "masculino").length;
  const mulheres = visiveis.filter((l) => l.sexo === "feminino").length;
  const ok = visiveis.filter((l) => l.presente).length;
  const pagos = visiveis.filter(
    (l) => l.status === "confirmada" || l.pagoCentavos > 0
  ).length;
  const totalPago = visiveis.reduce((s, l) => s + l.pagoCentavos, 0);

  function marcar(id: string, presente: boolean) {
    startTransition(async () => {
      await marcarChegadaPlanilha(fonte, id, presente);
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">
            Conferência na porta: veja o pagamento e marque OK quando a pessoa
            chegar. A quantidade atualiza para a tesouraria.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => baixarExcel(visiveis, titulo)}
          disabled={visiveis.length === 0}
        >
          Baixar Excel
        </Button>
      </div>

      <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-5">
        <Quadro titulo="Homens" valor={String(homens)} />
        <Quadro titulo="Mulheres" valor={String(mulheres)} />
        <Quadro titulo="Pagos" valor={String(pagos)} />
        <Quadro titulo="OK na porta" valor={String(ok)} destaque />
        <Quadro titulo="Total pago" valor={formatarReais(totalPago)} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar pelo nome"
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["todos", "Todos"],
              ["masculino", "Só homens"],
              ["feminino", "Só mulheres"],
            ] as const
          ).map(([id, rotulo]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFiltroSexo(id)}
              className={`border px-3 py-1.5 text-xs font-semibold ${
                filtroSexo === id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-muted"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma inscrição neste filtro.
        </p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="border-b border-border px-3 py-2 font-semibold">
                  Nome
                </th>
                <th className="border-b border-border px-3 py-2 font-semibold">
                  Sexo
                </th>
                <th className="border-b border-border px-3 py-2 font-semibold">
                  Forma
                </th>
                <th className="border-b border-border px-3 py-2 font-semibold">
                  Pago
                </th>
                <th className="border-b border-border px-3 py-2 font-semibold">
                  Status
                </th>
                <th className="border-b border-border px-3 py-2 font-semibold">
                  Chegada
                </th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((linha) => {
                const quitado =
                  linha.status === "confirmada" ||
                  (linha.devidoCentavos > 0 &&
                    linha.pagoCentavos >= linha.devidoCentavos) ||
                  (linha.devidoCentavos === 0 && linha.pagoCentavos > 0);
                return (
                  <tr
                    key={linha.id}
                    className={`border-b border-border last:border-0 ${
                      linha.presente ? "bg-muted/30" : ""
                    }`}
                  >
                    <td className="px-3 py-2 font-medium">
                      {linha.nome}
                      {linha.detalhe ? (
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {linha.detalhe}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{rotuloSexo(linha.sexo)}</td>
                    <td className="px-3 py-2">{linha.forma}</td>
                    <td className="px-3 py-2">
                      {linha.pagoCentavos > 0
                        ? formatarReais(linha.pagoCentavos)
                        : "Ainda não conferido"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`text-xs font-semibold ${
                          quitado ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {rotuloStatus(linha.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        size="sm"
                        type="button"
                        variant={linha.presente ? "outline" : "default"}
                        disabled={pending}
                        onClick={() => marcar(linha.id, !linha.presente)}
                      >
                        {linha.presente ? "Desfazer OK" : "OK"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Quadro({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className={`bg-background p-3 ${destaque ? "ring-1 ring-inset ring-foreground/20" : ""}`}>
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-lg font-semibold">{valor}</p>
    </div>
  );
}
