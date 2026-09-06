"use server";

import { createClient } from "@/lib/supabase/server";
import {
  lerValoresLegado,
  validarInscricaoLegado,
  type EstadoInscricaoLegado,
} from "@/lib/validations/inscricao-legado";
import {
  lerValoresPagamentoLegado,
  validarPagamentoLegado,
} from "@/lib/validations/pagamento-legado";

export async function inscreverNoLegado(
  _estadoAnterior: EstadoInscricaoLegado,
  formData: FormData
): Promise<EstadoInscricaoLegado> {
  const valoresPessoais = lerValoresLegado(formData);
  const valoresPagamento = lerValoresPagamentoLegado(formData);
  const valores = { ...valoresPessoais, ...valoresPagamento };

  const pessoais = validarInscricaoLegado(valoresPessoais);
  if (Object.keys(pessoais.erros).length > 0) {
    return { status: "erro", erros: pessoais.erros, valores, etapa: 1 };
  }

  const pagamento = validarPagamentoLegado(valoresPagamento);
  if (Object.keys(pagamento.erros).length > 0) {
    return { status: "erro", erros: pagamento.erros, valores, etapa: 2 };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inscricoes_legado").insert({
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
