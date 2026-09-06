"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExcluirInscricaoButton } from "@/components/excluir-inscricao-button";
import { type StatusInscricao } from "@/lib/validations/inscricao-encontro";
import {
  ROTULOS_FORMA,
  formatarReais,
  type FormaPagamento,
} from "@/lib/validations/pagamento-legado";
import {
  alternarPresenca,
  aprovarInscricao,
  definirStatus,
  excluirInscricao,
} from "./actions";
import { EditarPagamentoForm } from "./editar-pagamento-form";

export type InscricaoLegadoPainel = {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  cidade: string | null;
  nome_contato_emergencia: string | null;
  telefone_contato_emergencia: string | null;
  primeiro_legado: boolean;
  status: StatusInscricao;
  presente: boolean;
  created_at: string;
  forma_pagamento: FormaPagamento | null;
  parcelas: number | null;
  valor_devido_centavos: number;
  valor_cobrado_centavos: number;
  valor_pago_centavos: number;
  pagamento_observacao: string | null;
  comprovanteUrl: string | null;
  ehPdf: boolean;
  temComprovante: boolean;
};

const ROTULOS_STATUS: Record<StatusInscricao, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

type Filtro = "fila" | "todas" | StatusInscricao | "falta";

function calcularIdade(dataNascimento: string) {
  const nascimento = new Date(`${dataNascimento}T00:00:00`);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) idade--;
  return idade;
}

function formatarTelefone(digitos: string) {
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return digitos;
}

function rotuloForma(item: InscricaoLegadoPainel) {
  if (!item.forma_pagamento) return "Forma não informada";
  const base = ROTULOS_FORMA[item.forma_pagamento];
  if (item.forma_pagamento === "credito" && item.parcelas) {
    return item.parcelas === 1 ? `${base} à vista` : `${base} em ${item.parcelas}x`;
  }
  return base;
}

function faltaPagar(item: InscricaoLegadoPainel) {
  return Math.max(item.valor_devido_centavos - item.valor_pago_centavos, 0);
}

function ordemStatus(status: StatusInscricao) {
  if (status === "pendente") return 0;
  if (status === "confirmada") return 1;
  return 2;
}

export function ListaInscricoes({
  inscricoes,
  podeAprovar,
}: {
  inscricoes: InscricaoLegadoPainel[];
  podeAprovar: boolean;
}) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("fila");

  const contagem = {
    fila: inscricoes.filter((i) => i.status === "pendente").length,
    todas: inscricoes.length,
    confirmada: inscricoes.filter((i) => i.status === "confirmada").length,
    cancelada: inscricoes.filter((i) => i.status === "cancelada").length,
    falta: inscricoes.filter((i) => i.status !== "cancelada" && faltaPagar(i) > 0)
      .length,
  };

  const arrecadado = inscricoes.reduce((s, i) => s + (i.valor_pago_centavos || 0), 0);
  const aReceber = inscricoes
    .filter((i) => i.status !== "cancelada")
    .reduce((s, i) => s + faltaPagar(i), 0);

  const visiveis = useMemo(() => {
    const texto = busca.trim().toLowerCase();
    return inscricoes
      .filter((i) => {
        if (filtro === "fila") return i.status === "pendente";
        if (filtro === "falta") return i.status !== "cancelada" && faltaPagar(i) > 0;
        if (filtro !== "todas") return i.status === filtro;
        return true;
      })
      .filter((i) => {
        if (!texto) return true;
        const alvo = [i.nome_completo, i.email, i.telefone, i.cidade ?? ""]
          .join(" ")
          .toLowerCase();
        return alvo.includes(texto);
      })
      .sort((a, b) => {
        const porStatus = ordemStatus(a.status) - ordemStatus(b.status);
        if (porStatus !== 0) return porStatus;
        return +new Date(b.created_at) - +new Date(a.created_at);
      });
  }, [busca, filtro, inscricoes]);

  const chips: { id: Filtro; rotulo: string; n: number }[] = [
    { id: "fila", rotulo: "Para conferir", n: contagem.fila },
    { id: "todas", rotulo: "Todas", n: contagem.todas },
    { id: "confirmada", rotulo: "Confirmadas", n: contagem.confirmada },
    { id: "falta", rotulo: "Falta pagar", n: contagem.falta },
    { id: "cancelada", rotulo: "Recusadas", n: contagem.cancelada },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-3">
        <Quadro titulo="Para conferir" valor={String(contagem.fila)} detalhe="aguardando sua aprovação" />
        <Quadro titulo="Já entrou" valor={formatarReais(arrecadado)} detalhe="soma do que você marcou como pago" />
        <Quadro titulo="Ainda falta" valor={formatarReais(aReceber)} detalhe="confirmadas e pendentes com saldo" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, telefone ou e-mail"
          className="w-full border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFiltro(chip.id)}
              className={`border px-3 py-1.5 text-xs font-semibold ${
                filtro === chip.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-muted"
              }`}
            >
              {chip.rotulo} ({chip.n})
            </button>
          ))}
        </div>
      </div>

      {visiveis.length === 0 ? (
        <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {inscricoes.length === 0
            ? "Ninguém se inscreveu ainda."
            : "Nada neste filtro. Tente outro ou limpe a busca."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visiveis.map((item) => (
            <CartaoInscricao key={item.id} item={item} podeAprovar={podeAprovar} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Quadro({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe: string }) {
  return (
    <div className="bg-background p-4">
      <p className="text-xs text-muted-foreground">{titulo}</p>
      <p className="mt-1 text-xl font-semibold">{valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>
    </div>
  );
}

function CartaoInscricao({
  item,
  podeAprovar,
}: {
  item: InscricaoLegadoPainel;
  podeAprovar: boolean;
}) {
  const pago = item.valor_pago_centavos;
  const devido = item.valor_devido_centavos;
  const falta = faltaPagar(item);
  const quitado = devido > 0 && pago >= devido;
  const whatsapp = item.telefone.length >= 10 ? `https://wa.me/55${item.telefone}` : null;

  return (
    <li className="border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{item.nome_completo}</h2>
          <p className="text-sm text-muted-foreground">
            {calcularIdade(item.data_nascimento)} anos
            {item.cidade ? ` · ${item.cidade}` : ""} ·{" "}
            {new Date(item.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="border border-border px-2 py-0.5 text-xs font-semibold">
            {ROTULOS_STATUS[item.status]}
          </span>
          {item.presente && (
            <span className="border border-foreground px-2 py-0.5 text-xs font-semibold">
              Presente
            </span>
          )}
          {quitado ? (
            <span className="border border-foreground px-2 py-0.5 text-xs font-semibold">
              Quitado
            </span>
          ) : falta > 0 ? (
            <span className="border border-border px-2 py-0.5 text-xs font-semibold">
              Falta {formatarReais(falta)}
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-sm">
        {formatarTelefone(item.telefone)}
        {whatsapp && (
          <>
            {" · "}
            <a href={whatsapp} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
              WhatsApp
            </a>
          </>
        )}
        {" · "}
        <a href={`mailto:${item.email}`} className="underline underline-offset-2">
          {item.email}
        </a>
      </p>

      <div className="mt-4 grid gap-2 border-t border-border pt-4 text-sm sm:grid-cols-4">
        <Dado rotulo="Forma" valor={rotuloForma(item)} />
        <Dado rotulo="Primeiro Legado" valor={item.primeiro_legado ? "Sim" : "Não"} />
        <Dado rotulo="Devido" valor={formatarReais(devido)} />
        <Dado rotulo="Pago" valor={pago > 0 ? formatarReais(pago) : "Ainda não conferido"} />
      </div>

      {podeAprovar && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {item.status === "pendente" && (
            <form action={aprovarInscricao.bind(null, item.id)}>
              <Button size="sm" type="submit">
                Aprovar
              </Button>
            </form>
          )}
          {item.status === "pendente" && (
            <form action={definirStatus.bind(null, item.id, "cancelada")}>
              <Button size="sm" variant="outline" type="submit">
                Recusar
              </Button>
            </form>
          )}
          {item.status !== "pendente" && (
            <form action={definirStatus.bind(null, item.id, "pendente")}>
              <Button size="sm" variant="outline" type="submit">
                Voltar para pendente
              </Button>
            </form>
          )}
          <form action={alternarPresenca.bind(null, item.id, !item.presente)}>
            <Button size="sm" variant="outline" type="submit">
              {item.presente ? "Desmarcar presença" : "Marcar presença"}
            </Button>
          </form>
        </div>
      )}

      <details className="mt-4 border-t border-border pt-3" open={item.status === "pendente"}>
        <summary className="cursor-pointer text-sm font-semibold">
          {item.status === "pendente" ? "Comprovante e dados para conferir" : "Mais detalhes"}
        </summary>

        <div className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Dado rotulo="Declarou no envio" valor={formatarReais(item.valor_cobrado_centavos || 0)} />
          {item.nome_contato_emergencia && (
            <Dado
              rotulo="Emergência"
              valor={`${item.nome_contato_emergencia}${
                item.telefone_contato_emergencia
                  ? ` · ${formatarTelefone(item.telefone_contato_emergencia)}`
                  : ""
              }`}
            />
          )}
          {item.pagamento_observacao && (
            <div className="sm:col-span-2">
              <Dado rotulo="Nota do pagamento" valor={item.pagamento_observacao} />
            </div>
          )}
        </div>

        {podeAprovar && (
          <div className="mt-4">
            {item.temComprovante ? (
              item.comprovanteUrl ? (
                item.ehPdf ? (
                  <a
                    href={item.comprovanteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold underline underline-offset-2"
                  >
                    Abrir comprovante (PDF)
                  </a>
                ) : (
                  <a href={item.comprovanteUrl} target="_blank" rel="noreferrer" className="block max-w-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.comprovanteUrl}
                      alt={`Comprovante de ${item.nome_completo}`}
                      className="max-h-64 w-full border border-border object-contain"
                    />
                  </a>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Comprovante enviado, mas o link não abriu. Atualize a página.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem comprovante — pagamento presencial (dinheiro ou débito).
              </p>
            )}
          </div>
        )}

        {podeAprovar && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <EditarPagamentoForm
              inscricaoId={item.id}
              formaInicial={item.forma_pagamento}
              parcelasInicial={item.parcelas}
              primeiroLegadoInicial={item.primeiro_legado}
              valorPagoCentavos={item.valor_pago_centavos ?? 0}
              observacaoInicial={item.pagamento_observacao}
            />
            <ExcluirInscricaoButton
              inscricaoId={item.id}
              nome={item.nome_completo}
              action={excluirInscricao}
            />
          </div>
        )}
      </details>
    </li>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p>{valor}</p>
    </div>
  );
}
