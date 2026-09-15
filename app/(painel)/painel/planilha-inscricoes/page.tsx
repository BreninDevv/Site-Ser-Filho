import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  obterPerfilAtual,
  podeConferirPlanilha,
} from "@/lib/auth/permissoes";
import { ROTULOS_FORMA } from "@/lib/validations/pagamento-encontro";
import { rotuloFormaPlanilha } from "@/components/planilha-inscricoes";
import {
  PlanilhaPorta,
  type LinhaPlanilhaPorta,
} from "./planilha-porta";
import type { FormaPagamento } from "@/lib/validations/pagamento-encontro";
import type { FontePlanilha } from "./actions";
import Link from "next/link";

type Origem = FontePlanilha | `evento:${string}`;

function parseOrigem(bruto: string | undefined): Origem {
  if (!bruto) return "encontro";
  if (bruto === "encontro" || bruto === "legado") return bruto;
  if (bruto.startsWith("evento:")) return bruto as Origem;
  return "encontro";
}

export default async function PlanilhaInscricoesPage({
  searchParams,
}: {
  searchParams: Promise<{ origem?: string }>;
}) {
  const perfil = await obterPerfilAtual();
  if (!podeConferirPlanilha(perfil)) {
    redirect("/login");
  }

  const params = await searchParams;
  const origem = parseOrigem(params.origem);
  const supabase = await createClient();

  const { data: eventos } = await supabase
    .from("eventos")
    .select("id, nome, exige_inscricao")
    .eq("exige_inscricao", true)
    .order("publicar_em", { ascending: false });

  let linhas: LinhaPlanilhaPorta[] = [];
  let titulo = "Volta ao Jardim";
  let fonte: FontePlanilha = "encontro";

  if (origem === "legado") {
    fonte = "legado";
    titulo = "Legado de Cristo";
    const { data } = await supabase
      .from("inscricoes_legado")
      .select(
        "id, nome_completo, sexo, forma_pagamento, parcelas, valor_pago_centavos, valor_devido_centavos, status, presente"
      )
      .order("nome_completo", { ascending: true });
    linhas = (data ?? []).map((i) => ({
      id: i.id,
      nome: i.nome_completo,
      sexo: i.sexo ?? null,
      forma: rotuloFormaPlanilha(
        i.forma_pagamento as FormaPagamento | null,
        i.parcelas
      ),
      pagoCentavos: i.valor_pago_centavos ?? 0,
      devidoCentavos: i.valor_devido_centavos ?? 0,
      status: i.status,
      presente: Boolean(i.presente),
    }));
  } else if (typeof origem === "string" && origem.startsWith("evento:")) {
    fonte = "evento";
    const eventoId = origem.slice("evento:".length);
    const evento = (eventos ?? []).find((e) => e.id === eventoId);
    titulo = evento?.nome ?? "Evento";
    const selectEvento =
      "id, nome, sexo, forma_pagamento, valor_pago_centavos, valor_cobrado_centavos, status, presente";
    let { data, error } = await supabase
      .from("inscricoes_evento")
      .select(selectEvento)
      .eq("evento_id", eventoId)
      .order("nome", { ascending: true });
    if (error && /presente|sexo/i.test(error.message ?? "")) {
      const retry = await supabase
        .from("inscricoes_evento")
        .select(
          "id, nome, forma_pagamento, valor_pago_centavos, valor_cobrado_centavos, status"
        )
        .eq("evento_id", eventoId)
        .order("nome", { ascending: true });
      data = retry.data as typeof data;
      error = retry.error;
    }
    if (error) {
      linhas = [];
    } else {
      linhas = (data ?? []).map((i) => ({
        id: i.id,
        nome: i.nome,
        sexo: ("sexo" in i ? (i.sexo as string | null) : null) ?? null,
        forma: i.forma_pagamento
          ? ROTULOS_FORMA[i.forma_pagamento as FormaPagamento]
          : "Não informada",
        pagoCentavos: i.valor_pago_centavos ?? 0,
        devidoCentavos: i.valor_cobrado_centavos ?? 0,
        status: i.status,
        presente: Boolean("presente" in i ? i.presente : false),
      }));
    }
  } else {
    fonte = "encontro";
    titulo = "Volta ao Jardim";
    const { data } = await supabase
      .from("inscricoes_encontro")
      .select(
        "id, nome_completo, sexo, forma_pagamento, parcelas, valor_pago_centavos, valor_devido_centavos, status, presente, pastor_nome"
      )
      .order("nome_completo", { ascending: true });
    linhas = (data ?? []).map((i) => ({
      id: i.id,
      nome: i.nome_completo,
      sexo: i.sexo ?? null,
      forma: rotuloFormaPlanilha(
        i.forma_pagamento as FormaPagamento | null,
        i.parcelas
      ),
      pagoCentavos: i.valor_pago_centavos ?? 0,
      devidoCentavos: i.valor_devido_centavos ?? 0,
      status: i.status,
      presente: Boolean(i.presente),
      detalhe: i.pastor_nome ? `Pastor ${i.pastor_nome}` : undefined,
    }));
  }

  const opcoes: { id: string; rotulo: string }[] = [
    { id: "encontro", rotulo: "Volta ao Jardim" },
    { id: "legado", rotulo: "Legado de Cristo" },
    ...(eventos ?? []).map((e) => ({
      id: `evento:${e.id}`,
      rotulo: `Evento · ${e.nome}`,
    })),
  ];

  const origemAtual =
    typeof origem === "string" ? origem : "encontro";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold">Planilha de inscrições</h1>
        <p className="text-sm text-muted-foreground">
          Escolha Encontro, Legado ou um evento com inscrição. Filtre por
          homem/mulher, marque OK na chegada e baixe a planilha em Excel.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {opcoes.map((opcao) => {
          const ativa = origemAtual === opcao.id;
          return (
            <Link
              key={opcao.id}
              href={`/painel/planilha-inscricoes?origem=${encodeURIComponent(opcao.id)}`}
              className={`border px-3 py-1.5 text-xs font-semibold ${
                ativa
                  ? "border-foreground bg-foreground text-background"
                  : "border-border hover:bg-muted"
              }`}
            >
              {opcao.rotulo}
            </Link>
          );
        })}
      </div>

      {(eventos ?? []).length === 0 && origemAtual.startsWith("evento:") ? (
        <p className="text-sm text-muted-foreground">
          Nenhum evento com inscrição aberta no momento.
        </p>
      ) : null}

      <PlanilhaPorta fonte={fonte} titulo={titulo} linhas={linhas} />
    </div>
  );
}
