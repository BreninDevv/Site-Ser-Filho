/**
 * Fonte única dos preços e das regras de pagamento do Encontro.
 * Tudo em centavos para não haver erro de arredondamento com float.
 */
export const VALOR_ENCONTRO_CENTAVOS = 20_000;
export const VALOR_ENTRADA_CENTAVOS = 10_000;
export const VALOR_CRIANCA_CENTAVOS = 5_000;

/** R$ 200,00 viram R$ 219,75 no parcelado: 9,875% de taxa. À vista não tem taxa. */
export const TAXA_CREDITO_PARCELADO = 0.09875;
export const MAX_PARCELAS = 3;
export const MAX_CRIANCAS = 10;

export const CHAVE_PIX = "aefa7931-3830-4fc9-a99b-656b0db25d05";

/** Bucket privado: o painel lê os comprovantes por URL assinada e temporária. */
export const BUCKET_COMPROVANTES = "comprovantes-encontro";
export const TAMANHO_MAX_COMPROVANTE = 5 * 1024 * 1024;
export const TIPOS_COMPROVANTE = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export const FORMAS_PAGAMENTO = ["pix", "dinheiro", "debito", "credito"] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const ROTULOS_FORMA: Record<FormaPagamento, string> = {
  pix: "Pix",
  dinheiro: "Dinheiro",
  debito: "Cartão de débito",
  credito: "Cartão de crédito",
};

export const DESCRICOES_FORMA: Record<FormaPagamento, string> = {
  pix: "Pague pela chave abaixo e anexe o comprovante.",
  dinheiro: "Pagamento presencial na igreja. O comprovante é opcional.",
  debito: "Pagamento presencial na máquina da igreja. O comprovante é opcional.",
  credito: "À vista sem taxa, ou em até 3x com taxa. Anexe o comprovante.",
};

/** Dinheiro e débito são presenciais: não existe comprovante para anexar. */
export function exigeComprovante(forma: FormaPagamento) {
  return forma === "pix" || forma === "credito";
}

export function aceitaParcelamento(forma: FormaPagamento) {
  return forma === "credito";
}

export const OPCOES_VALOR = ["entrada", "total"] as const;
export type OpcaoValor = (typeof OPCOES_VALOR)[number];

export const CAMPOS_PAGAMENTO = [
  "forma_pagamento",
  "parcelas",
  "opcao_valor",
  "leva_crianca",
  "qtd_criancas",
  "comprovante_path",
] as const;

export type CampoPagamento = (typeof CAMPOS_PAGAMENTO)[number];

export type ValoresPagamento = Record<CampoPagamento, string>;
export type ErrosPagamento = Partial<Record<CampoPagamento, string>>;

export type DadosPagamento = {
  forma_pagamento: FormaPagamento;
  parcelas: number | null;
  leva_crianca: boolean;
  qtd_criancas: number;
  valor_devido_centavos: number;
  valor_escolhido_centavos: number;
  valor_cobrado_centavos: number;
  comprovante_path: string | null;
};

export type Valores = {
  /** Total da inscrição: encontro + crianças. */
  devido: number;
  /** Quanto a pessoa escolheu quitar agora. */
  escolhido: number;
  /** Quanto ela paga de fato (com taxa, se crédito parcelado). */
  cobrado: number;
  taxaAplicada: boolean;
};

export function calcularValores(entrada: {
  opcao: OpcaoValor;
  qtdCriancas: number;
  forma: FormaPagamento | null;
  parcelas: number | null;
}): Valores {
  const devido =
    VALOR_ENCONTRO_CENTAVOS + VALOR_CRIANCA_CENTAVOS * entrada.qtdCriancas;

  const escolhido =
    entrada.opcao === "entrada" ? VALOR_ENTRADA_CENTAVOS : devido;

  const taxaAplicada =
    entrada.forma === "credito" && (entrada.parcelas ?? 1) > 1;

  const cobrado = taxaAplicada
    ? Math.round(escolhido * (1 + TAXA_CREDITO_PARCELADO))
    : escolhido;

  return { devido, escolhido, cobrado, taxaAplicada };
}

export function formatarReais(centavos: number) {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function lerValoresPagamento(formData: FormData): ValoresPagamento {
  return CAMPOS_PAGAMENTO.reduce((acumulado, campo) => {
    acumulado[campo] = ((formData.get(campo) as string | null) ?? "").trim();
    return acumulado;
  }, {} as ValoresPagamento);
}

export function validarPagamento(valores: ValoresPagamento): {
  erros: ErrosPagamento;
  dados: DadosPagamento;
} {
  const erros: ErrosPagamento = {};

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

  let levaCrianca: boolean | null = null;
  if (valores.leva_crianca === "sim") levaCrianca = true;
  if (valores.leva_crianca === "nao") levaCrianca = false;

  if (levaCrianca === null) {
    erros.leva_crianca = "Diga se você vai levar criança.";
  }

  let qtdCriancas = 0;
  if (levaCrianca) {
    const lidas = Number(valores.qtd_criancas);
    if (!Number.isInteger(lidas) || lidas < 1) {
      erros.qtd_criancas = "Informe quantas crianças, a partir de 1.";
    } else if (lidas > MAX_CRIANCAS) {
      erros.qtd_criancas = `No máximo ${MAX_CRIANCAS} crianças por inscrição.`;
    } else {
      qtdCriancas = lidas;
    }
  }

  const comprovante = valores.comprovante_path || null;
  if (forma && exigeComprovante(forma) && !comprovante) {
    erros.comprovante_path = "Anexe o comprovante do pagamento.";
  }

  const calculo = calcularValores({
    opcao: opcao ?? "entrada",
    qtdCriancas,
    forma,
    parcelas,
  });

  return {
    erros,
    dados: {
      forma_pagamento: forma ?? "pix",
      parcelas,
      leva_crianca: levaCrianca ?? false,
      qtd_criancas: qtdCriancas,
      valor_devido_centavos: calculo.devido,
      valor_escolhido_centavos: calculo.escolhido,
      valor_cobrado_centavos: calculo.cobrado,
      comprovante_path: comprovante,
    },
  };
}
