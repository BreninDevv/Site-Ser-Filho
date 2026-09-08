"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigeAprovadorDePagamento } from "@/lib/auth/permissoes";
import { idsInscricaoValidos, removerArquivosDoBucket } from "@/lib/inscricoes/excluir-lote";
import { uuidValido } from "@/lib/seguranca";
import { STATUS_INSCRICAO, type StatusInscricao } from "@/lib/validations/inscricao-encontro";
import { BUCKET_COMPROVANTES_EVENTO } from "@/lib/validations/inscricao-evento";

function revalidar() {
  revalidatePath("/painel/inscricoes-eventos");
}

export async function definirStatusEvento(id: string, status: StatusInscricao) {
  if (!uuidValido(id) || !STATUS_INSCRICAO.includes(status)) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  await supabase.from("inscricoes_evento").update({ status }).eq("id", id);
  revalidar();
}

export async function aprovarInscricaoEvento(id: string) {
  if (!uuidValido(id)) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from("inscricoes_evento")
    .select("valor_cobrado_centavos, valor_pago_centavos")
    .eq("id", id)
    .single();

  const jaLancado = (data?.valor_pago_centavos ?? 0) > 0;

  await supabase
    .from("inscricoes_evento")
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

export async function excluirInscricaoEvento(id: string) {
  await excluirInscricoesEvento([id]);
}

export async function excluirInscricoesEvento(ids: string[]) {
  const validos = idsInscricaoValidos(ids);
  if (validos.length === 0) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("inscricoes_evento")
    .select("comprovante_path")
    .in("id", validos);

  await removerArquivosDoBucket(
    BUCKET_COMPROVANTES_EVENTO,
    (data ?? []).map((i) => i.comprovante_path)
  );

  await supabase.from("inscricoes_evento").delete().in("id", validos);
  revalidar();
}

export async function excluirTodasInscricoesEvento() {
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("inscricoes_evento")
    .select("comprovante_path");

  await removerArquivosDoBucket(
    BUCKET_COMPROVANTES_EVENTO,
    (data ?? []).map((i) => i.comprovante_path)
  );

  await supabase
    .from("inscricoes_evento")
    .delete()
    .gte("created_at", "1970-01-01");
  revalidar();
}
