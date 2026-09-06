import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExcluirInscricaoButton } from "@/components/excluir-inscricao-button";
import { createClient } from "@/lib/supabase/server";
import {
  obterPerfilAtual,
  podeAprovarPagamento,
  podeVerInscricoes,
} from "@/lib/auth/permissoes";
import {
  STATUS_INSCRICAO,
  type StatusInscricao,
} from "@/lib/validations/inscricao-encontro";
import {
  BUCKET_COMPROVANTES,
  ROTULOS_FORMA,
  VALOR_CRIANCA_CENTAVOS,
  formatarReais,
  type FormaPagamento,
} from "@/lib/validations/pagamento-encontro";
import {
  alternarPresenca,
  aprovarInscricao,
  definirStatus,
  excluirInscricao,
} from "./actions";
import { EditarPagamentoForm } from "./editar-pagamento-form";

type Inscricao = {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  sexo: string | null;
  cidade: string | null;
  nome_contato_emergencia: string | null;
  telefone_contato_emergencia: string | null;
  observacoes: string | null;
  como_soube: string | null;
  status: StatusInscricao;
  presente: boolean;
  created_at: string;
  forma_pagamento: FormaPagamento | null;
  parcelas: number | null;
  leva_crianca: boolean;
  qtd_criancas: number;
  valor_devido_centavos: number;
  valor_escolhido_centavos: number;
  valor_cobrado_centavos: number;
  valor_pago_centavos: number;
  comprovante_path: string | null;
  pagamento_observacao: string | null;
};

const ROTULOS_STATUS: Record<StatusInscricao, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

const CLASSES_STATUS: Record<StatusInscricao, string> = {
  pendente: "border-border text-muted-foreground",
  confirmada: "border-foreground text-foreground",
  cancelada: "border-destructive/40 text-destructive",
};

function calcularIdade(dataNascimento: string) {
  const nascimento = new Date(`${dataNascimento}T00:00:00`);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();

  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

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

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function rotuloForma(inscricao: Inscricao) {
  if (!inscricao.forma_pagamento) return "Não informado";
  const base = ROTULOS_FORMA[inscricao.forma_pagamento];
  if (inscricao.forma_pagamento === "credito" && inscricao.parcelas) {
    return inscricao.parcelas === 1
      ? `${base} à vista`
      : `${base} em ${inscricao.parcelas}x`;
  }
  return base;
}

export default async function PainelEncontroPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filtro } = await searchParams;
  const perfil = await obterPerfilAtual();
  const podeAprovar = podeAprovarPagamento(perfil);

  if (!podeVerInscricoes(perfil)) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-1">Inscrições do Encontro</h1>
        <p className="text-sm text-muted-foreground">
          Apenas líderes, pastores e dev podem ver as inscrições.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inscricoes_encontro")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-1">Inscrições do Encontro</h1>
        <p className="mt-4 border border-destructive/40 p-4 text-sm text-destructive">
          Não foi possível carregar as inscrições. Se as colunas de pagamento
          ainda não existem, rode{" "}
          <code>supabase/migrations/002_pagamento_encontro.sql</code> no SQL
          Editor do Supabase.
        </p>
      </div>
    );
  }

  const inscricoes = (data ?? []) as Inscricao[];

  const comprovantes = new Map<string, string>();
  if (podeAprovar) {
    const comArquivo = inscricoes.filter((i) => i.comprovante_path);
    const urls = await Promise.all(
      comArquivo.map(async (i) => {
        const { data: assinado } = await supabase.storage
          .from(BUCKET_COMPROVANTES)
          .createSignedUrl(i.comprovante_path!, 60 * 30);
        return [i.id, assinado?.signedUrl ?? ""] as const;
      })
    );
    for (const [id, url] of urls) {
      if (url) comprovantes.set(id, url);
    }
  }

  const contagem = {
    todas: inscricoes.length,
    pendente: inscricoes.filter((i) => i.status === "pendente").length,
    confirmada: inscricoes.filter((i) => i.status === "confirmada").length,
    cancelada: inscricoes.filter((i) => i.status === "cancelada").length,
    presentes: inscricoes.filter((i) => i.presente).length,
    entrada: inscricoes.filter(
      (i) => i.valor_pago_centavos > 0 && i.valor_pago_centavos < i.valor_devido_centavos
    ).length,
    quitadas: inscricoes.filter(
      (i) => i.valor_devido_centavos > 0 && i.valor_pago_centavos >= i.valor_devido_centavos
    ).length,
  };

  const filtroAtivo = STATUS_INSCRICAO.includes(filtro as StatusInscricao)
    ? (filtro as StatusInscricao)
    : null;

  const visiveis = filtroAtivo
    ? inscricoes.filter((i) => i.status === filtroAtivo)
    : inscricoes;

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-semibold mb-1">Inscrições do Encontro</h1>
        <p className="text-sm text-muted-foreground">
          {contagem.todas} inscrição(ões) · {contagem.confirmada} confirmada(s) ·{" "}
          {contagem.quitadas} quitada(s) · {contagem.entrada} com entrada parcial
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={filtroAtivo === null ? "default" : "outline"} size="sm" asChild>
          <Link href="/painel/encontro">Todas ({contagem.todas})</Link>
        </Button>
        {STATUS_INSCRICAO.map((status) => (
          <Button
            key={status}
            variant={filtroAtivo === status ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/painel/encontro?status=${status}`}>
              {ROTULOS_STATUS[status]} ({contagem[status]})
            </Link>
          </Button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <p className="border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {contagem.todas === 0
            ? "Ninguém se inscreveu ainda."
            : "Nenhuma inscrição com esse status."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visiveis.map((inscricao) => {
            const pago = inscricao.valor_pago_centavos;
            const devido = inscricao.valor_devido_centavos;
            const cobrado = inscricao.valor_cobrado_centavos;
            const comprovanteUrl = comprovantes.get(inscricao.id);
            const ehPdf = inscricao.comprovante_path?.toLowerCase().endsWith(".pdf");

            return (
              <li key={inscricao.id} className="border border-border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{inscricao.nome_completo}</h2>
                    <p className="text-sm text-muted-foreground">
                      {calcularIdade(inscricao.data_nascimento)} anos
                      {inscricao.cidade ? ` · ${inscricao.cidade}` : ""} · inscrito em{" "}
                      {formatarData(inscricao.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {inscricao.presente && (
                      <span className="border border-foreground px-2 py-0.5 text-xs font-semibold">
                        Presente
                      </span>
                    )}
                    {pago > 0 && devido > 0 && pago < devido && (
                      <span className="border border-border px-2 py-0.5 text-xs font-semibold">
                        Entrada parcial
                      </span>
                    )}
                    {pago > 0 && devido > 0 && pago >= devido && (
                      <span className="border border-foreground px-2 py-0.5 text-xs font-semibold">
                        Quitado
                      </span>
                    )}
                    <span
                      className={`border px-2 py-0.5 text-xs font-semibold ${CLASSES_STATUS[inscricao.status]}`}
                    >
                      {ROTULOS_STATUS[inscricao.status]}
                    </span>
                  </div>
                </div>

                <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Telefone</dt>
                    <dd>{formatarTelefone(inscricao.telefone)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">E-mail</dt>
                    <dd className="break-all">{inscricao.email}</dd>
                  </div>
                  {inscricao.nome_contato_emergencia && (
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Contato de emergência
                      </dt>
                      <dd>
                        {inscricao.nome_contato_emergencia}
                        {inscricao.telefone_contato_emergencia
                          ? ` · ${formatarTelefone(inscricao.telefone_contato_emergencia)}`
                          : ""}
                      </dd>
                    </div>
                  )}
                  {inscricao.como_soube && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Como soube</dt>
                      <dd>{inscricao.como_soube}</dd>
                    </div>
                  )}
                  {inscricao.observacoes && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-muted-foreground">
                        Saúde / alimentação
                      </dt>
                      <dd>{inscricao.observacoes}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-4 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold">Pagamento</h3>
                  <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">Forma</dt>
                      <dd>{rotuloForma(inscricao)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Crianças</dt>
                      <dd>
                        {inscricao.qtd_criancas > 0
                          ? `${inscricao.qtd_criancas} (${formatarReais(inscricao.qtd_criancas * VALOR_CRIANCA_CENTAVOS)})`
                          : "Nenhuma"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Valor devido</dt>
                      <dd>{formatarReais(devido || 0)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        Declarado no envio
                      </dt>
                      <dd>{formatarReais(cobrado || 0)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Valor pago</dt>
                      <dd>
                        {pago > 0 ? formatarReais(pago) : "Ainda não conferido"}
                      </dd>
                    </div>
                    {devido > pago && (
                      <div>
                        <dt className="text-xs text-muted-foreground">Falta</dt>
                        <dd>{formatarReais(Math.max(devido - pago, 0))}</dd>
                      </div>
                    )}
                    {inscricao.pagamento_observacao && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs text-muted-foreground">
                          Observação do pagamento
                        </dt>
                        <dd>{inscricao.pagamento_observacao}</dd>
                      </div>
                    )}
                  </dl>

                  {podeAprovar && inscricao.comprovante_path && (
                    <div className="mt-3">
                      {comprovanteUrl ? (
                        ehPdf ? (
                          <a
                            href={comprovanteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold underline underline-offset-2"
                          >
                            Abrir comprovante (PDF)
                          </a>
                        ) : (
                          <a
                            href={comprovanteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block max-w-xs"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={comprovanteUrl}
                              alt={`Comprovante de ${inscricao.nome_completo}`}
                              className="max-h-48 w-full border border-border object-contain"
                            />
                          </a>
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Comprovante enviado, mas não foi possível gerar o link.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {podeAprovar && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                    {inscricao.status !== "confirmada" && (
                      <form action={aprovarInscricao.bind(null, inscricao.id)}>
                        <Button size="sm" type="submit">
                          Aprovar inscrição
                        </Button>
                      </form>
                    )}
                    {inscricao.status !== "cancelada" && (
                      <form action={definirStatus.bind(null, inscricao.id, "cancelada")}>
                        <Button size="sm" variant="outline" type="submit">
                          Recusar
                        </Button>
                      </form>
                    )}
                    {inscricao.status !== "pendente" && (
                      <form action={definirStatus.bind(null, inscricao.id, "pendente")}>
                        <Button size="sm" variant="outline" type="submit">
                          Voltar para pendente
                        </Button>
                      </form>
                    )}
                    <form
                      action={alternarPresenca.bind(
                        null,
                        inscricao.id,
                        !inscricao.presente
                      )}
                    >
                      <Button size="sm" variant="outline" type="submit">
                        {inscricao.presente ? "Desmarcar presença" : "Marcar presença"}
                      </Button>
                    </form>
                    <ExcluirInscricaoButton
                      inscricaoId={inscricao.id}
                      nome={inscricao.nome_completo}
                      action={excluirInscricao}
                    />
                    <EditarPagamentoForm
                      inscricaoId={inscricao.id}
                      formaInicial={inscricao.forma_pagamento}
                      parcelasInicial={inscricao.parcelas}
                      qtdCriancasInicial={inscricao.qtd_criancas ?? 0}
                      valorPagoCentavos={inscricao.valor_pago_centavos ?? 0}
                      observacaoInicial={inscricao.pagamento_observacao}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
