"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigeAprovadorDePagamento } from "@/lib/auth/permissoes";
import { uuidValido } from "@/lib/seguranca";
import {
  STATUS_INSCRICAO,
  type StatusInscricao,
} from "@/lib/validations/inscricao-encontro";
import {
  BUCKET_COMPROVANTES_LEGADO,
  FORMAS_PAGAMENTO,
  MAX_PARCELAS,
  calcularValoresLegado,
  type FormaPagamento,
} from "@/lib/validations/pagamento-legado";

function revalidar() {
  revalidatePath("/painel/legado");
}

export async function definirStatus(id: string, status: StatusInscricao) {
  if (!uuidValido(id)) return;
  if (!STATUS_INSCRICAO.includes(status)) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  await supabase.from("inscricoes_legado").update({ status }).eq("id", id);
  revalidar();
}

export async function aprovarInscricao(id: string) {
  if (!uuidValido(id)) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("inscricoes_legado")
    .select(
      "valor_cobrado_centavos, valor_pago_centavos, valor_devido_centavos, complemento_pendente, complemento_valor_centavos"
    )
    .eq("id", id)
    .single();

  if (data?.complemento_pendente) {
    const extra = data.complemento_valor_centavos ?? 0;
    const devido = data.valor_devido_centavos ?? 0;
    const pago = data.valor_pago_centavos ?? 0;
    await supabase
      .from("inscricoes_legado")
      .update({
        status: "confirmada",
        valor_pago_centavos: devido > 0 ? Math.min(devido, pago + extra) : pago + extra,
        complemento_pendente: false,
        aprovado_por: user.id,
        aprovado_em: new Date().toISOString(),
      })
      .eq("id", id);
    revalidar();
    return;
  }

  const jaLancado = (data?.valor_pago_centavos ?? 0) > 0;

  await supabase
    .from("inscricoes_legado")
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
  if (!uuidValido(id)) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  await supabase.from("inscricoes_legado").update({ presente }).eq("id", id);
  revalidar();
}

export async function excluirInscricao(id: string) {
  if (!uuidValido(id)) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("inscricoes_legado")
    .select("comprovante_path")
    .eq("id", id)
    .single();

  if (data?.comprovante_path) {
    await supabase.storage
      .from(BUCKET_COMPROVANTES_LEGADO)
      .remove([data.comprovante_path]);
  }

  await supabase.from("inscricoes_legado").delete().eq("id", id);
  revalidar();
}

export async function atualizarPagamento(id: string, formData: FormData) {
  if (!uuidValido(id)) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const formaBruta = String(formData.get("forma_pagamento") ?? "");
  const forma = FORMAS_PAGAMENTO.includes(formaBruta as FormaPagamento)
    ? (formaBruta as FormaPagamento)
    : null;
  if (!forma) return;

  const primeiroBruto = String(formData.get("primeiro_legado") ?? "");
  if (primeiroBruto !== "sim" && primeiroBruto !== "nao") return;

  let parcelas: number | null = null;
  if (forma === "credito") {
    const lidas = Number(formData.get("parcelas") || "1");
    if (!Number.isInteger(lidas) || lidas < 1 || lidas > MAX_PARCELAS) return;
    parcelas = lidas;
  }

  const bruto = String(formData.get("valor_pago") ?? "0").replace(",", ".");
  const valorPago = Math.round(Number(bruto) * 100);
  if (!Number.isFinite(valorPago) || valorPago < 0) return;

  const observacao = String(formData.get("pagamento_observacao") ?? "")
    .trim()
    .slice(0, 500);

  if (valorPago > 200_000) return;

  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("inscricoes_legado")
    .select("valor_devido_centavos, valor_escolhido_centavos")
    .eq("id", id)
    .single();

  const devidoAnterior = atual?.valor_devido_centavos ?? 0;
  const escolhidoAnterior = atual?.valor_escolhido_centavos ?? 0;
  const eraTotal = devidoAnterior > 0 && escolhidoAnterior >= devidoAnterior;

  const calculo = calcularValoresLegado({
    opcao: eraTotal ? "total" : "entrada",
    forma,
    parcelas,
  });

  await supabase
    .from("inscricoes_legado")
    .update({
      forma_pagamento: forma,
      parcelas,
      primeiro_legado: primeiroBruto === "sim",
      valor_devido_centavos: calculo.devido,
      valor_escolhido_centavos: calculo.escolhido,
      valor_cobrado_centavos: calculo.cobrado,
      valor_pago_centavos: Math.min(valorPago, calculo.cobrado),
      pagamento_observacao: observacao || null,
    })
    .eq("id", id);

  revalidar();
}
