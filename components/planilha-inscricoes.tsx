"use client";

import { useMemo, useState } from "react";
import {
  OPCOES_SEXO,
  ROTULOS_SEXO,
} from "@/lib/validations/inscricao-encontro";
import { formatarReais } from "@/lib/validations/pagamento-encontro";
import { rotuloFormaPlanilha } from "@/lib/inscricoes/rotulo-forma-planilha";
import { TextoComSexo, RotuloSexoColorido, TituloSexo } from "@/components/texto-com-sexo";

export { rotuloFormaPlanilha };

export type LinhaPlanilhaInscricao = {
  id: string;
  nome: string;
  sexo: string | null;
  forma: string;
  pagoCentavos: number;
};

function celulaSexo(sexo: string | null) {
  if (sexo === "masculino" || sexo === "feminino") {
    return <RotuloSexoColorido sexo={sexo} />;
  }
  if (sexo && OPCOES_SEXO.includes(sexo as (typeof OPCOES_SEXO)[number])) {
    return ROTULOS_SEXO[sexo as (typeof OPCOES_SEXO)[number]];
  }
  return "Não informado";
}

export function PlanilhaInscricoes({
  linhas,
}: {
  linhas: LinhaPlanilhaInscricao[];
}) {
  const [busca, setBusca] = useState("");

  const visiveis = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return linhas
      .filter((linha) =>
        texto ? linha.nome.toLowerCase().includes(texto) : true
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [busca, linhas]);

  const homens = visiveis.filter((l) => l.sexo === "masculino").length;
  const mulheres = visiveis.filter((l) => l.sexo === "feminino").length;
  const semSexo = visiveis.length - homens - mulheres;
  const totalPago = visiveis.reduce((s, l) => s + l.pagoCentavos, 0);

  return (
    <section className="space-y-3 border border-border p-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Planilha</h2>
        <p className="text-sm text-muted-foreground">
          <TextoComSexo>
            Homens, mulheres, forma de pagamento e quanto cada um já pagou.
          </TextoComSexo>
        </p>
      </div>

      <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-4">
        <QuadroPlanilha titulo="Homens" valor={String(homens)} />
        <QuadroPlanilha titulo="Mulheres" valor={String(mulheres)} />
        <QuadroPlanilha titulo="Não informado" valor={String(semSexo)} />
        <QuadroPlanilha titulo="Pago na lista" valor={formatarReais(totalPago)} />
      </div>

      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar na planilha pelo nome"
        className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground sm:max-w-sm"
      />

      {visiveis.length === 0 ? (
        <p className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {linhas.length === 0
            ? "Nenhuma inscrição para montar a planilha."
            : "Nenhum nome encontrado nessa busca."}
        </p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-3 py-2 font-semibold">Nome</th>
                <th className="px-3 py-2 font-semibold">Sexo</th>
                <th className="px-3 py-2 font-semibold">Forma</th>
                <th className="px-3 py-2 font-semibold">Valor pago</th>
              </tr>
            </thead>
            <tbody>
              {visiveis.map((linha) => (
                <tr key={linha.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium">{linha.nome}</td>
                  <td className="px-3 py-2">{celulaSexo(linha.sexo)}</td>
                  <td className="px-3 py-2">{linha.forma}</td>
                  <td className="px-3 py-2">
                    {linha.pagoCentavos > 0
                      ? formatarReais(linha.pagoCentavos)
                      : "Ainda não conferido"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function QuadroPlanilha({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="bg-background p-3">
      <p>
        <TituloSexo>{titulo}</TituloSexo>
      </p>
      <p className="mt-1 text-lg font-semibold">{valor}</p>
    </div>
  );
}
