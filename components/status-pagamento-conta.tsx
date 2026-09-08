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
}: {
  pagamento: StatusInscricao;
}) {
  return (
    <div className="mt-5 border border-[#dcdad3] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#141412]/55">
        Pagamento
      </p>
      <p className="mt-1 text-lg font-semibold">
        {ROTULOS_STATUS_PAGAMENTO[pagamento]}
      </p>
      <p className="mt-1 text-sm text-[#141412]/70">
        {TEXTOS_STATUS_PAGAMENTO[pagamento]}
      </p>
    </div>
  );
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

  let bruto = (await supabase.rpc(rpc)).data as string | null;

  if (!bruto && user.email) {
    const tabela =
      rpc === "status_pagamento_encontro"
        ? "inscricoes_encontro"
        : "inscricoes_legado";
    const { data: linha } = await supabase
      .from(tabela)
      .select("status")
      .ilike("email", user.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    bruto = linha?.status ?? null;
  }

  const pagamento = STATUS_INSCRICAO.includes(bruto as StatusInscricao)
    ? (bruto as StatusInscricao)
    : null;

  return (
    <CartaoStatusPagamento>
      <p className="mt-2 mb-5 text-sm text-[#141412]/70">
        Status da inscrição ligada ao e-mail desta conta
        {user.email ? ` (${user.email})` : ""}.
      </p>
      {pagamento ? (
        <ResultadoStatusPagamento pagamento={pagamento} />
      ) : (
        <p className="text-sm text-[#141412]/70">
          Não achamos inscrição com este e-mail. Se você se inscreveu com outro
          endereço, entre com essa conta.
        </p>
      )}
    </CartaoStatusPagamento>
  );
}
