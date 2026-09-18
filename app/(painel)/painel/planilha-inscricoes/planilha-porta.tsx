"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  TextoComSexo,
  RotuloSexoColorido,
  TituloSexo,
} from "@/components/texto-com-sexo";
import {
  ROTULOS_PAPEL_ENCONTRO,
  ROTULOS_SEXO,
  type PapelEncontro,
} from "@/lib/validations/inscricao-encontro";
import { formatarReais } from "@/lib/validations/pagamento-encontro";
import {
  marcarChegadaPlanilha,
  type FontePlanilha,
} from "./actions";

export type LinhaPlanilhaPorta = {
  id: string;
  pastorNome: string | null;
  nome: string;
  sexo: string | null;
  papel: PapelEncontro | null;
  forma: string;
  pagoCentavos: number;
  devidoCentavos: number;
  status: string;
  presente: boolean;
  detalhe?: string;
};

type FiltroPlanilha =
  | "todos"
  | "masculino"
  | "feminino"
  | "trabalhador_masculino"
  | "trabalhador_feminino"
  | "encontrista_masculino"
  | "encontrista_feminino";

function rotuloSexo(sexo: string | null) {
  if (sexo === "masculino" || sexo === "feminino" || sexo === "outro") {
    return ROTULOS_SEXO[sexo];
  }
  return "Não informado";
}

function rotuloPapel(papel: PapelEncontro | null) {
  if (!papel) return "—";
  return ROTULOS_PAPEL_ENCONTRO[papel];
}

function passaFiltro(linha: LinhaPlanilhaPorta, filtro: FiltroPlanilha) {
  if (filtro === "todos") return true;
  if (filtro === "masculino") return linha.sexo === "masculino";
  if (filtro === "feminino") return linha.sexo === "feminino";
  if (filtro === "trabalhador_masculino") {
    return linha.papel === "trabalhador" && linha.sexo === "masculino";
  }
  if (filtro === "trabalhador_feminino") {
    return linha.papel === "trabalhador" && linha.sexo === "feminino";
  }
  if (filtro === "encontrista_masculino") {
    return linha.papel === "encontrista" && linha.sexo === "masculino";
  }
  if (filtro === "encontrista_feminino") {
    return linha.papel === "encontrista" && linha.sexo === "feminino";
  }
  return true;
}

function RotuloSexoCelula({ sexo }: { sexo: string | null }) {
  if (sexo === "masculino" || sexo === "feminino") {
    return <RotuloSexoColorido sexo={sexo} />;
  }
  return <>{rotuloSexo(sexo)}</>;
}

function rotuloStatus(status: string) {
  if (status === "confirmada") return "Pago / confirmado";
  if (status === "pendente") return "Em análise";
  if (status === "cancelada") return "Recusado";
  return status;
}

function escaparXml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function larguraColunaExcel(textos: string[]) {
  const maxChars = Math.max(8, ...textos.map((t) => Array.from(t).length));
  // SpreadsheetML: ~7pt por caractere + folga
  return Math.min(Math.max(maxChars * 7 + 12, 56), 320);
}

function baixarExcel(
  linhas: LinhaPlanilhaPorta[],
  titulo: string,
  comPapel: boolean
) {
  const cabecalho = [
    "Pastor",
    "Nome",
    ...(comPapel ? ["Papel"] : []),
    "Sexo",
    "Forma de pagamento",
    "Valor pago",
    "Valor devido",
    "Status",
    "Chegou (OK)",
    "Detalhe",
  ];

  const corpo = linhas.map((l) => [
    l.pastorNome ?? "",
    l.nome,
    ...(comPapel ? [rotuloPapel(l.papel)] : []),
    rotuloSexo(l.sexo),
    l.forma,
    (l.pagoCentavos / 100).toFixed(2).replace(".", ","),
    (l.devidoCentavos / 100).toFixed(2).replace(".", ","),
    rotuloStatus(l.status),
    l.presente ? "Sim" : "Não",
    l.detalhe ?? "",
  ]);

  const colunasXml = cabecalho
    .map((_, i) => {
      const textos = [cabecalho[i], ...corpo.map((linha) => String(linha[i] ?? ""))];
      return `<Column ss:AutoFitWidth="1" ss:Width="${larguraColunaExcel(textos)}"/>`;
    })
    .join("");

  const celula = (valor: string) =>
    `<Cell><Data ss:Type="String">${escaparXml(valor)}</Data></Cell>`;

  const linhaCabecalho = `<Row>${cabecalho.map(celula).join("")}</Row>`;
  const linhasXml = corpo
    .map((linha) => `<Row>${linha.map((c) => celula(String(c))).join("")}</Row>`)
    .join("");

  const nomeAba = titulo.replace(/[\\/*?:\[\]]/g, "").slice(0, 31) || "Planilha";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${escaparXml(nomeAba)}">
  <Table>
   ${colunasXml}
   ${linhaCabecalho}
   ${linhasXml}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const data = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${titulo.replace(/\s+/g, "-").toLowerCase()}-${data}.xls`;
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
  const [filtro, setFiltro] = useState<FiltroPlanilha>("todos");
  const [pending, startTransition] = useTransition();
  const comPapel = fonte === "encontro";

  const visiveis = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return linhas
      .filter((l) => l.status !== "cancelada")
      .filter((l) => passaFiltro(l, filtro))
      .filter((l) =>
        texto
          ? l.nome.toLowerCase().includes(texto) ||
            (l.pastorNome ?? "").toLowerCase().includes(texto)
          : true
      )
      .sort((a, b) => {
        if (a.presente !== b.presente) return a.presente ? 1 : -1;
        const pastorCmp = (a.pastorNome ?? "").localeCompare(
          b.pastorNome ?? "",
          "pt-BR"
        );
        if (pastorCmp !== 0) return pastorCmp;
        return a.nome.localeCompare(b.nome, "pt-BR");
      });
  }, [busca, filtro, linhas]);

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

  const filtrosBase: { id: FiltroPlanilha; rotulo: string }[] = [
    { id: "todos", rotulo: "Todos" },
  ];

  const filtrosPapel: { id: FiltroPlanilha; rotulo: string }[] = [
    { id: "trabalhador_masculino", rotulo: "Só Trabalhador Homem" },
    { id: "trabalhador_feminino", rotulo: "Só Trabalhadora Mulher" },
    { id: "encontrista_masculino", rotulo: "Só Encontrista Homem" },
    { id: "encontrista_feminino", rotulo: "Só Encontrista Mulher" },
  ];

  const filtrosSexo: { id: FiltroPlanilha; rotulo: string }[] = [
    { id: "masculino", rotulo: "Só homens" },
    { id: "feminino", rotulo: "Só mulheres" },
  ];

  // Encontro: Todos + papel/sexo. Legado/Evento: Todos + só sexo.
  const filtros = comPapel
    ? [...filtrosBase, ...filtrosPapel]
    : [...filtrosBase, ...filtrosSexo];

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
          onClick={() => baixarExcel(visiveis, titulo, comPapel)}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar pelo nome ou pastor"
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {filtros.map(({ id, rotulo }) => (
            <button
              key={id}
              type="button"
              onClick={() => setFiltro(id)}
              className={`border px-3 py-1.5 text-xs font-semibold ${
                filtro === id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-muted"
              }`}
            >
              <TextoComSexo>{rotulo}</TextoComSexo>
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
          <table className="w-max min-w-full border-collapse text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold">
                  Pastor
                </th>
                <th className="whitespace-nowrap border-b border-border bg-foreground px-3 py-2 font-semibold text-background">
                  Nome
                </th>
                {comPapel ? (
                  <th className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold">
                    Papel
                  </th>
                ) : null}
                <th className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold">
                  Sexo
                </th>
                <th className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold">
                  Forma
                </th>
                <th className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold">
                  Pago
                </th>
                <th className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold">
                  Status
                </th>
                <th className="whitespace-nowrap border-b border-border px-3 py-2 font-semibold">
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
                    <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                      {linha.pastorNome || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium">
                      {linha.nome}
                      {linha.detalhe ? (
                        <span className="mt-0.5 block whitespace-nowrap text-xs font-normal text-muted-foreground">
                          {linha.detalhe}
                        </span>
                      ) : null}
                    </td>
                    {comPapel ? (
                      <td className="whitespace-nowrap px-3 py-2">
                        {rotuloPapel(linha.papel)}
                      </td>
                    ) : null}
                    <td className="whitespace-nowrap px-3 py-2">
                      <RotuloSexoCelula sexo={linha.sexo} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{linha.forma}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {linha.pagoCentavos > 0
                        ? formatarReais(linha.pagoCentavos)
                        : "Ainda não conferido"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span
                        className={`text-xs font-semibold ${
                          quitado ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {rotuloStatus(linha.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
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
    <div
      className={`bg-background p-3 ${destaque ? "ring-1 ring-inset ring-foreground/20" : ""}`}
    >
      <p>
        <TituloSexo>{titulo}</TituloSexo>
      </p>
      <p className="mt-1 text-lg font-semibold">{valor}</p>
    </div>
  );
}
