import {
  exigeComprovante,
  FORMAS_PAGAMENTO,
  type FormaPagamento,
} from "./pagamento-encontro";
import { OPCOES_SEXO } from "./inscricao-encontro";

export {
  CHAVE_PIX,
  exigeComprovante,
  FORMAS_PAGAMENTO,
  formatarReais,
  ROTULOS_FORMA,
  TAMANHO_MAX_COMPROVANTE,
  TIPOS_COMPROVANTE,
  type FormaPagamento,
} from "./pagamento-encontro";

export const DESCRICOES_FORMA: Record<FormaPagamento, string> = {
  pix: "Pague pela chave abaixo e anexe o comprovante.",
  dinheiro: "Pagamento presencial na igreja.",
  debito: "Pagamento presencial na máquina da igreja.",
  credito: "Pague e anexe o comprovante.",
};

export const BUCKET_COMPROVANTES_EVENTO = "comprovantes-eventos";

export const ROTULOS_STATUS_PAGAMENTO = {
  pendente: "Em análise",
  confirmada: "Aprovado",
  cancelada: "Recusado",
} as const;

export const TEXTOS_STATUS_PAGAMENTO = {
  pendente: "A tesouraria ainda está conferindo o pagamento.",
  confirmada: "Pagamento aprovado. Sua inscrição está confirmada.",
  cancelada: "Pagamento recusado. Fale com a tesouraria se precisar.",
} as const;

export type EstadoInscricaoEvento =
  | { status: "inicial" }
  | {
      status: "erro";
      erros: Partial<Record<"nome" | "idade" | "sexo" | "forma_pagamento" | "comprovante_path", string>>;
      mensagem?: string;
    }
  | { status: "sucesso"; nome: string };

export const ESTADO_INICIAL_EVENTO: EstadoInscricaoEvento = { status: "inicial" };

export function validarInscricaoEvento(entrada: {
  nome: string;
  idade: string;
  sexo: string;
  forma: string;
  comprovante: string | null;
}) {
  const erros: Partial<
    Record<"nome" | "idade" | "sexo" | "forma_pagamento" | "comprovante_path", string>
  > = {};

  const nome = entrada.nome.trim().slice(0, 80);
  if (nome.length < 3) erros.nome = "Informe seu nome.";
  else if (!nome.includes(" ")) erros.nome = "Informe o nome completo, com sobrenome.";

  const idade = Number(entrada.idade);
  if (!Number.isInteger(idade) || idade < 1 || idade > 120) {
    erros.idade = "Informe uma idade válida.";
  }

  const sexo = OPCOES_SEXO.includes(entrada.sexo as (typeof OPCOES_SEXO)[number])
    ? (entrada.sexo as (typeof OPCOES_SEXO)[number])
    : null;
  if (!sexo) erros.sexo = "Informe se você é homem ou mulher.";

  const forma = FORMAS_PAGAMENTO.includes(entrada.forma as FormaPagamento)
    ? (entrada.forma as FormaPagamento)
    : null;
  if (!forma) erros.forma_pagamento = "Escolha a forma de pagamento.";

  if (forma && exigeComprovante(forma) && !entrada.comprovante) {
    erros.comprovante_path = "Anexe o comprovante do pagamento.";
  }

  return {
    erros,
    dados: {
      nome,
      idade: Number.isInteger(idade) ? idade : 0,
      sexo,
      forma_pagamento: forma ?? "pix",
      comprovante_path: entrada.comprovante,
    },
  };
}
