"use server";

import { createClient } from "@/lib/supabase/server";
import {
  lerValores,
  validarInscricao,
  type EstadoInscricao,
} from "@/lib/validations/inscricao-encontro";
import {
  lerValoresPagamento,
  validarPagamento,
} from "@/lib/validations/pagamento-encontro";
import {
  caminhoArquivoValido,
  dentroDoLimite,
  ehHoneypot,
  ipDoPedido,
} from "@/lib/seguranca";

export async function inscreverNoEncontro(
  _estadoAnterior: EstadoInscricao,
  formData: FormData
): Promise<EstadoInscricao> {
  try {
    if (ehHoneypot(formData)) {
      return { status: "sucesso", nome: "Inscrição" };
    }

    const ip = await ipDoPedido();
    if (!dentroDoLimite(`inscricao-encontro:${ip}`, 8, 10 * 60 * 1000)) {
      return {
        status: "erro",
        erros: {},
        valores: {},
        etapa: 2,
        mensagem: "Muitas tentativas. Espere alguns minutos e tente de novo.",
      };
    }

    const valoresPessoais = lerValores(formData);
    const valoresPagamento = lerValoresPagamento(formData);
    const valores = { ...valoresPessoais, ...valoresPagamento };

    const supabase = await createClient();
    let listaPastores: { id: string; nome: string }[] = [];
    try {
      const { data: pastores } = await supabase.rpc("pastores_para_inscricao");
      listaPastores = (pastores ?? []) as { id: string; nome: string }[];
    } catch {
      listaPastores = [];
    }

    const pessoais = validarInscricao(valoresPessoais, {
      temPastores: listaPastores.length > 0,
    });
    if (Object.keys(pessoais.erros).length > 0) {
      return { status: "erro", erros: pessoais.erros, valores, etapa: 1 };
    }

    const pagamento = validarPagamento(valoresPagamento);
    if (Object.keys(pagamento.erros).length > 0) {
      return { status: "erro", erros: pagamento.erros, valores, etapa: 2 };
    }

    if (!caminhoArquivoValido(pagamento.dados.comprovante_path)) {
      return {
        status: "erro",
        erros: { comprovante_path: "Comprovante inválido. Envie de novo." },
        valores,
        etapa: 2,
      };
    }

    const pastor = listaPastores.find((p) => p.id === pessoais.dados.pastor_id);
    if (pessoais.dados.pastor_id && !pastor) {
      return {
        status: "erro",
        erros: { pastor_id: "Esse pastor não está na lista. Escolha de novo." },
        valores,
        etapa: 1,
      };
    }

    const { error } = await supabase.from("inscricoes_encontro").insert({
      ...pessoais.dados,
      pastor_nome: pastor?.nome ?? null,
      ...pagamento.dados,
    });

    if (error) {
      return {
        status: "erro",
        erros: {},
        valores,
        etapa: 2,
        mensagem:
          error.message ||
          "Não foi possível enviar sua inscrição agora. Tente novamente em alguns instantes.",
      };
    }

    return { status: "sucesso", nome: pessoais.dados.nome_completo };
  } catch {
    return {
      status: "erro",
      erros: {},
      valores: {},
      etapa: 2,
      mensagem:
        "Não foi possível enviar sua inscrição agora. Tente novamente em alguns instantes.",
    };
  }
}
