import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  obterPerfilAtual,
  podeConferirPlanilha,
} from "@/lib/auth/permissoes";
import { rotuloFormaPlanilha } from "@/lib/inscricoes/rotulo-forma-planilha";
import {
  ROTULOS_FORMA,
  type FormaPagamento,
} from "@/lib/validations/pagamento-encontro";
import {
  PlanilhaPorta,
  type LinhaPlanilhaPorta,
} from "./planilha-porta";
import type { FontePlanilha } from "./actions";

type Origem = FontePlanilha | `evento:${string}`;

function parseOrigem(bruto: string | undefined): Origem {
  if (!bruto) return "encontro";
  if (bruto === "encontro" || bruto === "legado") return bruto;
  if (bruto.startsWith("evento:")) return bruto as Origem;
  return "encontro";
}

function formaSegura(valor: string | null | undefined, parcelas?: number | null) {
  if (!valor) return rotuloFormaPlanilha(null);
  if (valor in ROTULOS_FORMA) {
    return rotuloFormaPlanilha(valor as FormaPagamento, parcelas);
  }
  return valor;
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

  let eventos: { id: string; nome: string }[] = [];
  try {
    const { data } = await supabase
      .from("eventos")
      .select("id, nome, exige_inscricao, publicar_em")
      .eq("exige_inscricao", true)
      .order("publicar_em", { ascending: false });
    eventos = (data ?? []).map((e) => ({ id: e.id, nome: e.nome }));
  } catch {
    eventos = [];
  }

  let linhas: LinhaPlanilhaPorta[] = [];
  let titulo = "Volta ao Jardim";
  let fonte: FontePlanilha = "encontro";
  let aviso: string | null = null;

  try {
    if (origem === "legado") {
      fonte = "legado";
      titulo = "Legado de Cristo";
      const { data, error } = await supabase
        .from("inscricoes_legado")
        .select(
          "id, nome_completo, sexo, forma_pagamento, parcelas, valor_pago_centavos, valor_devido_centavos, status, presente"
        )
        .order("nome_completo", { ascending: true });
      if (error) {
        aviso = "Não foi possível carregar as inscrições do Legado.";
      } else {
        linhas = (data ?? []).map((i) => ({
          id: i.id,
          nome: i.nome_completo,
          sexo: i.sexo ?? null,
          forma: formaSegura(i.forma_pagamento, i.parcelas),
          pagoCentavos: i.valor_pago_centavos ?? 0,
          devidoCentavos: i.valor_devido_centavos ?? 0,
          status: i.status,
          presente: Boolean(i.presente),
        }));
      }
    } else if (typeof origem === "string" && origem.startsWith("evento:")) {
      fonte = "evento";
      const eventoId = origem.slice("evento:".length);
      const evento = eventos.find((e) => e.id === eventoId);
      titulo = evento?.nome ?? "Evento";
      let { data, error } = await supabase
        .from("inscricoes_evento")
        .select(
          "id, nome, sexo, forma_pagamento, valor_pago_centavos, valor_cobrado_centavos, status, presente"
        )
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
        aviso = "Não foi possível carregar as inscrições deste evento.";
      } else {
        linhas = (data ?? []).map((i) => ({
          id: i.id,
          nome: i.nome,
          sexo: ("sexo" in i ? (i.sexo as string | null) : null) ?? null,
          forma: formaSegura(i.forma_pagamento as string | null),
          pagoCentavos: i.valor_pago_centavos ?? 0,
          devidoCentavos: i.valor_cobrado_centavos ?? 0,
          status: i.status,
          presente: Boolean("presente" in i ? i.presente : false),
        }));
      }
    } else {
      fonte = "encontro";
      titulo = "Volta ao Jardim";
      const { data, error } = await supabase
        .from("inscricoes_encontro")
        .select(
          "id, nome_completo, sexo, forma_pagamento, parcelas, valor_pago_centavos, valor_devido_centavos, status, presente, pastor_nome"
        )
        .order("nome_completo", { ascending: true });
      if (error) {
        aviso = "Não foi possível carregar as inscrições do Encontro.";
      } else {
        linhas = (data ?? []).map((i) => ({
          id: i.id,
          nome: i.nome_completo,
          sexo: i.sexo ?? null,
          forma: formaSegura(i.forma_pagamento, i.parcelas),
          pagoCentavos: i.valor_pago_centavos ?? 0,
          devidoCentavos: i.valor_devido_centavos ?? 0,
          status: i.status,
          presente: Boolean(i.presente),
          detalhe: i.pastor_nome ? `Pastor ${i.pastor_nome}` : undefined,
        }));
      }
    }
  } catch {
    aviso = "Erro ao montar a planilha. Tente de novo em instantes.";
    linhas = [];
  }

  const opcoes: { id: string; rotulo: string }[] = [
    { id: "encontro", rotulo: "Volta ao Jardim" },
    { id: "legado", rotulo: "Legado de Cristo" },
    ...eventos.map((e) => ({
      id: `evento:${e.id}`,
      rotulo: `Evento · ${e.nome}`,
    })),
  ];

  const origemAtual = typeof origem === "string" ? origem : "encontro";

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

      {aviso ? (
        <p className="border border-destructive/40 p-4 text-sm text-destructive">
          {aviso}
        </p>
      ) : null}

      <PlanilhaPorta fonte={fonte} titulo={titulo} linhas={linhas} />
    </div>
  );
}
