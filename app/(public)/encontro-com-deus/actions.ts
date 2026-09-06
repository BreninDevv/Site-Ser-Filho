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

export async function inscreverNoEncontro(
  _estadoAnterior: EstadoInscricao,
  formData: FormData
): Promise<EstadoInscricao> {
  const valoresPessoais = lerValores(formData);
  const valoresPagamento = lerValoresPagamento(formData);
  const valores = { ...valoresPessoais, ...valoresPagamento };

  const pessoais = validarInscricao(valoresPessoais);
  if (Object.keys(pessoais.erros).length > 0) {
    return { status: "erro", erros: pessoais.erros, valores, etapa: 1 };
  }

  // Os valores em dinheiro são calculados aqui, a partir da opção e do número
  // de crianças: nada que venha do navegador entra direto no banco.
  const pagamento = validarPagamento(valoresPagamento);
  if (Object.keys(pagamento.erros).length > 0) {
    return { status: "erro", erros: pagamento.erros, valores, etapa: 2 };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inscricoes_encontro").insert({
    ...pessoais.dados,
    ...pagamento.dados,
  });

  if (error) {
    return {
      status: "erro",
      erros: {},
      valores,
      etapa: 2,
      mensagem:
        "Não foi possível enviar sua inscrição agora. Tente novamente em alguns instantes.",
    };
  }

  return { status: "sucesso", nome: pessoais.dados.nome_completo };
}
