"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigeAprovadorDePagamento } from "@/lib/auth/permissoes";
import { idsInscricaoValidos, removerArquivosDoBucket } from "@/lib/inscricoes/excluir-lote";
import { uuidValido } from "@/lib/seguranca";
import {
  STATUS_INSCRICAO,
  type StatusInscricao,
} from "@/lib/validations/inscricao-encontro";
import {
  BUCKET_COMPROVANTES,
  FORMAS_PAGAMENTO,
  MAX_CRIANCAS,
  MAX_PARCELAS,
  calcularValores,
  type FormaPagamento,
} from "@/lib/validations/pagamento-encontro";

function revalidar() {
  revalidatePath("/painel/encontro");
}

export async function definirStatus(id: string, status: StatusInscricao) {
  if (!uuidValido(id)) return;
  if (!STATUS_INSCRICAO.includes(status)) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  await supabase.from("inscricoes_encontro").update({ status }).eq("id", id);
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
    .from("inscricoes_encontro")
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
      .from("inscricoes_encontro")
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
  if (!uuidValido(id)) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  await supabase.from("inscricoes_encontro").update({ presente }).eq("id", id);
  revalidar();
}

export async function excluirInscricao(id: string) {
  await excluirInscricoes([id]);
}

export async function excluirInscricoes(ids: string[]) {
  const validos = idsInscricaoValidos(ids);
  if (validos.length === 0) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("inscricoes_encontro")
    .select("comprovante_path, complemento_comprovante_path")
    .in("id", validos);

  await removerArquivosDoBucket(BUCKET_COMPROVANTES, [
    ...(data ?? []).map((i) => i.comprovante_path),
    ...(data ?? []).map((i) => i.complemento_comprovante_path),
  ]);

  await supabase.from("inscricoes_encontro").delete().in("id", validos);
  revalidar();
}

export async function excluirTodasInscricoes() {
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("inscricoes_encontro")
    .select("comprovante_path, complemento_comprovante_path");

  await removerArquivosDoBucket(BUCKET_COMPROVANTES, [
    ...(data ?? []).map((i) => i.comprovante_path),
    ...(data ?? []).map((i) => i.complemento_comprovante_path),
  ]);

  await supabase
    .from("inscricoes_encontro")
    .delete()
    .gte("created_at", "1970-01-01");
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

  const observacao = String(formData.get("pagamento_observacao") ?? "")
    .trim()
    .slice(0, 500);

  if (valorPago > 200_000) return;

  const supabase = await createClient();
  const { data: atual } = await supabase
    .from("inscricoes_encontro")
    .select("valor_devido_centavos, valor_escolhido_centavos")
    .eq("id", id)
    .single();

  const devidoAnterior = atual?.valor_devido_centavos ?? 0;
  const escolhidoAnterior = atual?.valor_escolhido_centavos ?? 0;
  const eraTotal = devidoAnterior > 0 && escolhidoAnterior >= devidoAnterior;

  const calculo = calcularValores({
    opcao: eraTotal ? "total" : "entrada",
    qtdCriancas: qtd,
    forma,
    parcelas,
  });

  await supabase
    .from("inscricoes_encontro")
    .update({
      forma_pagamento: forma,
      parcelas,
      qtd_criancas: qtd,
      leva_crianca: qtd > 0,
      valor_devido_centavos: calculo.devido,
      valor_escolhido_centavos: calculo.escolhido,
      valor_cobrado_centavos: calculo.cobrado,
      valor_pago_centavos: Math.min(valorPago, calculo.cobrado),
      pagamento_observacao: observacao || null,
    })
    .eq("id", id);

  revalidar();
}
