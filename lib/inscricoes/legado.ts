import { createClient } from "@/lib/supabase/server";
import {
  lerValoresLegado,
  validarInscricaoLegado,
  type EstadoInscricaoLegado,
} from "@/lib/validations/inscricao-legado";
import { ehMenorDeIdade } from "@/lib/validations/inscricao-encontro";
import {
  lerValoresPagamentoLegado,
  validarPagamentoLegado,
} from "@/lib/validations/pagamento-legado";
import {
  caminhoArquivoValido,
  dentroDoLimite,
  ehHoneypot,
  ipDoPedido,
} from "@/lib/seguranca";

export async function processarInscricaoLegado(
  formData: FormData
): Promise<EstadoInscricaoLegado> {
  try {
    if (ehHoneypot(formData)) {
      return { status: "sucesso", nome: "Inscrição" };
    }

    const ip = await ipDoPedido();
    if (!dentroDoLimite(`inscricao-legado:${ip}`, 8, 10 * 60 * 1000)) {
      return {
        status: "erro",
        erros: {},
        valores: {},
        etapa: 2,
        mensagem: "Muitas tentativas. Espere alguns minutos e tente de novo.",
      };
    }

    const valoresPessoais = lerValoresLegado(formData);
    const valoresPagamento = lerValoresPagamentoLegado(formData);
    const valores = { ...valoresPessoais, ...valoresPagamento };

    const supabase = await createClient();
    let listaPastores: { id: string; nome: string }[] = [];
    try {
      const { data: pastores } = await supabase.rpc("pastores_para_inscricao");
      listaPastores = (pastores ?? []) as { id: string; nome: string }[];
    } catch {
      listaPastores = [];
    }

    const pessoais = validarInscricaoLegado(valoresPessoais);
    if (Object.keys(pessoais.erros).length > 0) {
      return { status: "erro", erros: pessoais.erros, valores, etapa: 1 };
    }

    const pastor = listaPastores.find((p) => p.id === pessoais.dados.pastor_id);
    if (!pastor) {
      return {
        status: "erro",
        erros: {
          pastor_id:
            listaPastores.length === 0
              ? "Ainda não há pastor cadastrado. Peça à equipe para liberar a lista."
              : "Esse pastor não está na lista. Escolha de novo.",
        },
        valores,
        etapa: 1,
      };
    }

    if (ehMenorDeIdade(pessoais.dados.data_nascimento)) {
      const path = pessoais.dados.autorizacao_path;
      if (!path || !caminhoArquivoValido(path)) {
        return {
          status: "erro",
          erros: {
            autorizacao_path:
              "Menor de 18 anos: envie a foto da autorização antes de concluir.",
          },
          valores,
          etapa: 1,
        };
      }
    }

    const pagamento = validarPagamentoLegado(valoresPagamento);
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

    const { error } = await supabase.from("inscricoes_legado").insert({
      ...pessoais.dados,
      pastor_nome: pastor.nome,
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
