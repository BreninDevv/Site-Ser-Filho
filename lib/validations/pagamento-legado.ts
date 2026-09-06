import {
  aceitaParcelamento,
  calcularValores as calcularValoresEncontro,
  exigeComprovante,
  FORMAS_PAGAMENTO,
  MAX_PARCELAS,
  OPCOES_VALOR,
  VALOR_ENCONTRO_CENTAVOS,
  VALOR_ENTRADA_CENTAVOS,
  type FormaPagamento,
  type OpcaoValor,
} from "./pagamento-encontro";

export {
  aceitaParcelamento,
  CHAVE_PIX,
  DESCRICOES_FORMA,
  exigeComprovante,
  FORMAS_PAGAMENTO,
  formatarReais,
  MAX_PARCELAS,
  OPCOES_VALOR,
  ROTULOS_FORMA,
  TAMANHO_MAX_COMPROVANTE,
  TAXA_CREDITO_PARCELADO,
  TIPOS_COMPROVANTE,
  VALOR_ENTRADA_CENTAVOS,
  type FormaPagamento,
  type OpcaoValor,
} from "./pagamento-encontro";

export const VALOR_LEGADO_CENTAVOS = VALOR_ENCONTRO_CENTAVOS;
export const BUCKET_COMPROVANTES_LEGADO = "comprovantes-legado";

export const CAMPOS_PAGAMENTO_LEGADO = [
  "forma_pagamento",
  "parcelas",
  "opcao_valor",
  "primeiro_legado",
  "comprovante_path",
] as const;

export type CampoPagamentoLegado = (typeof CAMPOS_PAGAMENTO_LEGADO)[number];
export type ValoresPagamentoLegado = Record<CampoPagamentoLegado, string>;
export type ErrosPagamentoLegado = Partial<Record<CampoPagamentoLegado, string>>;

export type DadosPagamentoLegado = {
  forma_pagamento: FormaPagamento;
  parcelas: number | null;
  primeiro_legado: boolean;
  valor_devido_centavos: number;
  valor_escolhido_centavos: number;
  valor_cobrado_centavos: number;
  comprovante_path: string | null;
};

export function calcularValoresLegado(entrada: {
  opcao: OpcaoValor;
  forma: FormaPagamento | null;
  parcelas: number | null;
}) {
  return calcularValoresEncontro({
    opcao: entrada.opcao,
    qtdCriancas: 0,
    forma: entrada.forma,
    parcelas: entrada.parcelas,
  });
}

export function lerValoresPagamentoLegado(
  formData: FormData
): ValoresPagamentoLegado {
  return CAMPOS_PAGAMENTO_LEGADO.reduce((acumulado, campo) => {
    acumulado[campo] = ((formData.get(campo) as string | null) ?? "").trim();
    return acumulado;
  }, {} as ValoresPagamentoLegado);
}

export function validarPagamentoLegado(valores: ValoresPagamentoLegado): {
  erros: ErrosPagamentoLegado;
  dados: DadosPagamentoLegado;
} {
  const erros: ErrosPagamentoLegado = {};

  const forma = FORMAS_PAGAMENTO.includes(valores.forma_pagamento as FormaPagamento)
    ? (valores.forma_pagamento as FormaPagamento)
    : null;

  if (!forma) {
    erros.forma_pagamento = "Escolha a forma de pagamento.";
  }

  let parcelas: number | null = null;
  if (forma && aceitaParcelamento(forma)) {
    const lidas = Number(valores.parcelas || "1");
    if (!Number.isInteger(lidas) || lidas < 1 || lidas > MAX_PARCELAS) {
      erros.parcelas = `Escolha de 1 a ${MAX_PARCELAS} parcelas.`;
    } else {
      parcelas = lidas;
    }
  }

  const opcao = OPCOES_VALOR.includes(valores.opcao_valor as OpcaoValor)
    ? (valores.opcao_valor as OpcaoValor)
    : null;

  if (!opcao) {
    erros.opcao_valor = "Escolha quanto você vai pagar agora.";
  }

  let primeiroLegado: boolean | null = null;
  if (valores.primeiro_legado === "sim") primeiroLegado = true;
  if (valores.primeiro_legado === "nao") primeiroLegado = false;
  if (primeiroLegado === null) {
    erros.primeiro_legado = "Diga se este é o seu primeiro Legado.";
  }

  const comprovante = valores.comprovante_path || null;
  if (forma && exigeComprovante(forma) && !comprovante) {
    erros.comprovante_path = "Anexe o comprovante do pagamento.";
  }

  const calculo = calcularValoresLegado({
    opcao: opcao ?? "entrada",
    forma,
    parcelas,
  });

  return {
    erros,
    dados: {
      forma_pagamento: forma ?? "pix",
      parcelas,
      primeiro_legado: primeiroLegado ?? false,
      valor_devido_centavos: calculo.devido,
      valor_escolhido_centavos: calculo.escolhido,
      valor_cobrado_centavos: calculo.cobrado,
      comprovante_path: comprovante,
    },
  };
}
