"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { caminhoArquivoValido, dentroDoLimite, ipDoPedido } from "@/lib/seguranca";
import {
  FORMAS_PAGAMENTO,
  exigeComprovante,
  type FormaPagamento,
} from "@/lib/validations/pagamento-encontro";

export type EstadoComplemento =
  | { status: "inicial" }
  | { status: "sucesso" }
  | { status: "erro"; mensagem: string };

export const ESTADO_COMPLEMENTO_INICIAL: EstadoComplemento = { status: "inicial" };

export async function enviarComplementoPagamento(
  origem: "encontro" | "legado",
  _estadoAnterior: EstadoComplemento,
  formData: FormData
): Promise<EstadoComplemento> {
  const ip = await ipDoPedido();
  if (!dentroDoLimite(`complemento-${origem}:${ip}`, 8, 10 * 60 * 1000)) {
    return {
      status: "erro",
      mensagem: "Muitas tentativas. Espere alguns minutos e tente de novo.",
    };
  }

  const formaBruta = String(formData.get("forma_pagamento") ?? "").trim();
  const forma = FORMAS_PAGAMENTO.includes(formaBruta as FormaPagamento)
    ? (formaBruta as FormaPagamento)
    : null;
  if (!forma) {
    return { status: "erro", mensagem: "Escolha a forma de pagamento." };
  }

  const comprovante = String(formData.get("comprovante_path") ?? "").trim();
  if (exigeComprovante(forma) && !comprovante) {
    return { status: "erro", mensagem: "Anexe o comprovante do pagamento." };
  }
  if (!caminhoArquivoValido(comprovante || null)) {
    return { status: "erro", mensagem: "Comprovante inválido. Envie de novo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      status: "erro",
      mensagem: "Entre na sua conta para completar o pagamento.",
    };
  }

  const rpc =
    origem === "encontro"
      ? "enviar_complemento_encontro"
      : "enviar_complemento_legado";

  const { error } = await supabase.rpc(rpc, {
    p_forma: forma,
    p_comprovante: comprovante,
  });

  if (error) {
    return {
      status: "erro",
      mensagem:
        error.message?.includes("nao ha saldo")
          ? "Não há valor restante para completar nesta inscrição."
          : error.message ||
            "Não foi possível enviar o complemento. Tente de novo.",
    };
  }

  if (origem === "encontro") {
    revalidatePath("/encontro-com-deus");
    revalidatePath("/painel/encontro");
  } else {
    revalidatePath("/legado-de-cristo");
    revalidatePath("/painel/legado");
  }

  return { status: "sucesso" };
}
