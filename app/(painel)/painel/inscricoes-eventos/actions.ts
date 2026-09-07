"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigeAprovadorDePagamento } from "@/lib/auth/permissoes";
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
  if (!uuidValido(id)) return;
  if (!(await exigeAprovadorDePagamento())) return;

  const supabase = await createClient();
  const { data } = await supabase
    .from("inscricoes_evento")
    .select("comprovante_path")
    .eq("id", id)
    .single();

  if (data?.comprovante_path) {
    await supabase.storage
      .from(BUCKET_COMPROVANTES_EVENTO)
      .remove([data.comprovante_path]);
  }

  await supabase.from("inscricoes_evento").delete().eq("id", id);
  revalidar();
}
