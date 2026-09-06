import type { CampoPagamentoLegado } from "./pagamento-legado";

export const CAMPOS_INSCRICAO_LEGADO = [
  "nome_completo",
  "email",
  "telefone",
  "data_nascimento",
  "sexo",
  "cidade",
  "nome_contato_emergencia",
  "telefone_contato_emergencia",
] as const;

export type CampoInscricaoLegado = (typeof CAMPOS_INSCRICAO_LEGADO)[number];

export type ValoresInscricaoLegado = Record<CampoInscricaoLegado, string>;
export type ErrosInscricaoLegado = Partial<Record<CampoInscricaoLegado, string>>;

export type DadosInscricaoLegado = {
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  sexo: string | null;
  cidade: string | null;
  nome_contato_emergencia: string | null;
  telefone_contato_emergencia: string | null;
};

export type CampoFormularioLegado = CampoInscricaoLegado | CampoPagamentoLegado;
export type ErrosFormularioLegado = Partial<Record<CampoFormularioLegado, string>>;
export type ValoresFormularioLegado = Partial<Record<CampoFormularioLegado, string>>;

export type EstadoInscricaoLegado =
  | { status: "inicial" }
  | {
      status: "erro";
      erros: ErrosFormularioLegado;
      valores: ValoresFormularioLegado;
      mensagem?: string;
      etapa: 1 | 2;
    }
  | { status: "sucesso"; nome: string };

export const ESTADO_INICIAL_LEGADO: EstadoInscricaoLegado = { status: "inicial" };

export { OPCOES_SEXO, STATUS_INSCRICAO, type StatusInscricao } from "./inscricao-encontro";

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

function telefoneValido(valor: string) {
  const digitos = apenasDigitos(valor);
  return digitos.length === 10 || digitos.length === 11;
}

function opcional(valor: string) {
  return valor.length > 0 ? valor : null;
}

export function lerValoresLegado(formData: FormData): ValoresInscricaoLegado {
  return CAMPOS_INSCRICAO_LEGADO.reduce((acumulado, campo) => {
    acumulado[campo] = ((formData.get(campo) as string | null) ?? "").trim();
    return acumulado;
  }, {} as ValoresInscricaoLegado);
}

export function validarInscricaoLegado(valores: ValoresInscricaoLegado): {
  erros: ErrosInscricaoLegado;
  dados: DadosInscricaoLegado;
} {
  const erros: ErrosInscricaoLegado = {};

  if (valores.nome_completo.length < 3) {
    erros.nome_completo = "Informe seu nome.";
  } else if (!valores.nome_completo.includes(" ")) {
    erros.nome_completo = "Informe o nome completo, com sobrenome.";
  }

  if (!valores.email) {
    erros.email = "Informe seu e-mail.";
  } else if (!FORMATO_EMAIL.test(valores.email)) {
    erros.email = "Esse e-mail não parece válido.";
  }

  if (!valores.telefone) {
    erros.telefone = "Informe seu telefone.";
  } else if (!telefoneValido(valores.telefone)) {
    erros.telefone = "Informe o telefone com DDD, por exemplo (11) 91234-5678.";
  }

  if (!valores.data_nascimento) {
    erros.data_nascimento = "Informe sua data de nascimento.";
  } else {
    const nascimento = new Date(`${valores.data_nascimento}T00:00:00`);
    const hoje = new Date();

    if (Number.isNaN(nascimento.getTime())) {
      erros.data_nascimento = "Data inválida.";
    } else if (nascimento > hoje) {
      erros.data_nascimento = "A data de nascimento não pode ser no futuro.";
    } else if (nascimento.getFullYear() < 1900) {
      erros.data_nascimento = "Confira o ano de nascimento.";
    }
  }

  if (
    valores.sexo &&
    !["feminino", "masculino", "outro"].includes(valores.sexo)
  ) {
    erros.sexo = "Escolha uma das opções.";
  }

  if (
    valores.telefone_contato_emergencia &&
    !telefoneValido(valores.telefone_contato_emergencia)
  ) {
    erros.telefone_contato_emergencia = "Informe o telefone com DDD.";
  }

  return {
    erros,
    dados: {
      nome_completo: valores.nome_completo,
      email: valores.email.toLowerCase(),
      telefone: apenasDigitos(valores.telefone),
      data_nascimento: valores.data_nascimento,
      sexo: opcional(valores.sexo),
      cidade: opcional(valores.cidade),
      nome_contato_emergencia: opcional(valores.nome_contato_emergencia),
      telefone_contato_emergencia: valores.telefone_contato_emergencia
        ? apenasDigitos(valores.telefone_contato_emergencia)
        : null,
    },
  };
}
