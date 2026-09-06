"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigeAprovadorDePagamento } from "@/lib/auth/permissoes";
import {
  STATUS_INSCRICAO,
  type StatusInscricao,
} from "@/lib/validations/inscricao-encontro";
import {
  BUCKET_COMPROVANTES,
  FORMAS_PAGAMENTO,
  MAX_CRIANCAS,
  MAX_PARCELAS,
  VALOR_CRIANCA_CENTAVOS,
  VALOR_ENCONTRO_CENTAVOS,
  type FormaPagamento,
} from "@/lib/validations/pagamento-encontro";

function revalidar() {
  revalidatePath("/painel/encontro");
}

export async function definirStatus(id: string, status: StatusInscricao) {
  if (!STATUS_INSCRICAO.includes(status)) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  await supabase.from("inscricoes_encontro").update({ status }).eq("id", id);
  revalidar();
}

export async function aprovarInscricao(id: string) {
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("inscricoes_encontro")
    .select("valor_cobrado_centavos, valor_pago_centavos")
    .eq("id", id)
    .single();

  const jaLancado = (data?.valor_pago_centavos ?? 0) > 0;

  await supabase
    .from("inscricoes_encontro")
    .update({
      status: "confirmada",
      valor_pago_centavos: jaLancado
        ? data!.valor_pago_centavos
        : (data?.valor_cobrado_centavos ?? 0),
      aprovado_por: user.id,
      aprovado_em: new Date().toISOString(),
    })
    .eq("id", id);

  revalidar();
}

export async function alternarPresenca(id: string, presente: boolean) {
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  await supabase.from("inscricoes_encontro").update({ presente }).eq("id", id);
  revalidar();
}

export async function excluirInscricao(id: string) {
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("inscricoes_encontro")
    .select("comprovante_path")
    .eq("id", id)
    .single();

  if (data?.comprovante_path) {
    await supabase.storage
      .from(BUCKET_COMPROVANTES)
      .remove([data.comprovante_path]);
  }

  await supabase.from("inscricoes_encontro").delete().eq("id", id);
  revalidar();
}

export async function atualizarPagamento(id: string, formData: FormData) {
  if (!(await exigeAprovadorDePagamento())) return;

  const formaBruta = String(formData.get("forma_pagamento") ?? "");
  const forma = FORMAS_PAGAMENTO.includes(formaBruta as FormaPagamento)
    ? (formaBruta as FormaPagamento)
    : null;
  if (!forma) return;

  const qtd = Number(formData.get("qtd_criancas"));
  if (!Number.isInteger(qtd) || qtd < 0 || qtd > MAX_CRIANCAS) return;

  let parcelas: number | null = null;
  if (forma === "credito") {
    const lidas = Number(formData.get("parcelas") || "1");
    if (!Number.isInteger(lidas) || lidas < 1 || lidas > MAX_PARCELAS) return;
    parcelas = lidas;
  }

  const bruto = String(formData.get("valor_pago") ?? "0").replace(",", ".");
  const valorPago = Math.round(Number(bruto) * 100);
  if (!Number.isFinite(valorPago) || valorPago < 0) return;

  const observacao = String(formData.get("pagamento_observacao") ?? "").trim();

  const supabase = await createClient();
  await supabase
    .from("inscricoes_encontro")
    .update({
      forma_pagamento: forma,
      parcelas,
      qtd_criancas: qtd,
      leva_crianca: qtd > 0,
      valor_devido_centavos: VALOR_ENCONTRO_CENTAVOS + VALOR_CRIANCA_CENTAVOS * qtd,
      valor_pago_centavos: valorPago,
      pagamento_observacao: observacao || null,
    })
    .eq("id", id);

  revalidar();
}
