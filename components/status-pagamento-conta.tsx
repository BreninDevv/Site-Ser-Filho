import { createClient } from "@/lib/supabase/server";
import {
  ROTULOS_STATUS_PAGAMENTO,
  TEXTOS_STATUS_PAGAMENTO,
} from "@/lib/validations/inscricao-evento";
import {
  STATUS_INSCRICAO,
  type StatusInscricao,
} from "@/lib/validations/inscricao-encontro";
import { AvisoStatusRequerConta } from "@/components/aviso-status-cadastro";
import { CompletarPagamentoForm } from "@/components/completar-pagamento-form";
import { BUCKET_COMPROVANTES, formatarReais } from "@/lib/validations/pagamento-encontro";
import { BUCKET_COMPROVANTES_LEGADO } from "@/lib/validations/pagamento-legado";

type DetalhePagamento = {
  status: StatusInscricao;
  valor_devido_centavos: number;
  valor_pago_centavos: number;
  falta_centavos: number;
  complemento_pendente: boolean;
};

export function CartaoStatusPagamento({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mt-10 border border-[#dcdad3] bg-[#faf9f6]/94 p-5 sm:p-7">
      <h3 className="font-heading text-2xl font-bold tracking-tight">
        Status do pagamento
      </h3>
      {children}
    </div>
  );
}

export function ResultadoStatusPagamento({
  pagamento,
  faltaCentavos,
}: {
  pagamento: StatusInscricao;
  faltaCentavos?: number;
}) {
  const texto =
    pagamento === "confirmada" && (faltaCentavos ?? 0) > 0
      ? `Entrada aprovada. Ainda falta ${formatarReais(faltaCentavos ?? 0)}.`
      : TEXTOS_STATUS_PAGAMENTO[pagamento];

  return (
    <div className="mt-5 border border-[#dcdad3] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#141412]/55">
        Pagamento
      </p>
      <p className="mt-1 text-lg font-semibold">
        {ROTULOS_STATUS_PAGAMENTO[pagamento]}
      </p>
      <p className="mt-1 text-sm text-[#141412]/70">{texto}</p>
    </div>
  );
}

async function carregarDetalhe(
  rpc: "status_pagamento_encontro" | "status_pagamento_legado"
): Promise<DetalhePagamento | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const rpcDetalhe =
    rpc === "status_pagamento_encontro"
      ? "detalhe_pagamento_encontro"
      : "detalhe_pagamento_legado";

  let linha: {
    status?: string;
    valor_devido_centavos?: number;
    valor_pago_centavos?: number;
    falta_centavos?: number;
    complemento_pendente?: boolean;
  } | null = null;

  try {
    const { data } = await supabase.rpc(rpcDetalhe);
    linha = (Array.isArray(data) ? data[0] : data) ?? null;
  } catch {
    linha = null;
  }

  if (linha?.status && STATUS_INSCRICAO.includes(linha.status as StatusInscricao)) {
    return {
      status: linha.status as StatusInscricao,
      valor_devido_centavos: Number(linha.valor_devido_centavos ?? 0),
      valor_pago_centavos: Number(linha.valor_pago_centavos ?? 0),
      falta_centavos: Number(linha.falta_centavos ?? 0),
      complemento_pendente: Boolean(linha.complemento_pendente),
    };
  }

  let bruto: string | null = null;
  try {
    bruto = (await supabase.rpc(rpc)).data as string | null;
  } catch {
    bruto = null;
  }

  if (!bruto && user.email) {
    const tabela =
      rpc === "status_pagamento_encontro"
        ? "inscricoes_encontro"
        : "inscricoes_legado";
    const { data: fallback } = await supabase
      .from(tabela)
      .select("status, valor_devido_centavos, valor_pago_centavos, complemento_pendente")
      .ilike("email", user.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (fallback?.status) {
      const devido = Number(fallback.valor_devido_centavos ?? 0);
      const pago = Number(fallback.valor_pago_centavos ?? 0);
      return {
        status: fallback.status as StatusInscricao,
        valor_devido_centavos: devido,
        valor_pago_centavos: pago,
        falta_centavos: Math.max(devido - pago, 0),
        complemento_pendente: Boolean(fallback.complemento_pendente),
      };
    }
    bruto = fallback?.status ?? null;
  }

  if (!STATUS_INSCRICAO.includes(bruto as StatusInscricao)) return null;

  return {
    status: bruto as StatusInscricao,
    valor_devido_centavos: 0,
    valor_pago_centavos: 0,
    falta_centavos: 0,
    complemento_pendente: false,
  };
}

export async function StatusPagamentoPorEmail({
  rpc,
}: {
  rpc: "status_pagamento_encontro" | "status_pagamento_legado";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <CartaoStatusPagamento>
        <AvisoStatusRequerConta />
      </CartaoStatusPagamento>
    );
  }

  const detalhe = await carregarDetalhe(rpc);
  const origem = rpc === "status_pagamento_encontro" ? "encontro" : "legado";
  const bucket =
    origem === "encontro" ? BUCKET_COMPROVANTES : BUCKET_COMPROVANTES_LEGADO;

  return (
    <CartaoStatusPagamento>
      <p className="mt-2 mb-5 text-sm text-[#141412]/70">
        Status da inscrição ligada ao e-mail desta conta
        {user.email ? ` (${user.email})` : ""}.
      </p>
      {detalhe ? (
        <>
          <ResultadoStatusPagamento
            pagamento={detalhe.status}
            faltaCentavos={detalhe.falta_centavos}
          />
          {detalhe.complemento_pendente && (
            <p className="mt-4 border border-[#4b6f36]/40 bg-[#fff8e7] p-4 text-sm">
              O restante já foi enviado. A tesouraria ainda está conferindo.
            </p>
          )}
          {detalhe.status === "confirmada" &&
            detalhe.falta_centavos > 0 &&
            !detalhe.complemento_pendente && (
              <CompletarPagamentoForm
                origem={origem}
                faltaCentavos={detalhe.falta_centavos}
                bucket={bucket}
              />
            )}
        </>
      ) : (
        <p className="text-sm text-[#141412]/70">
          Não achamos inscrição com este e-mail. Se você se inscreveu com outro
          endereço, entre com essa conta.
        </p>
      )}
    </CartaoStatusPagamento>
  );
}
