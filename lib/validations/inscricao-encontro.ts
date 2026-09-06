import type { CampoPagamento } from "./pagamento-encontro";

export const CAMPOS_INSCRICAO = [
  "nome_completo",
  "email",
  "telefone",
  "data_nascimento",
  "sexo",
  "cidade",
  "nome_contato_emergencia",
  "telefone_contato_emergencia",
  "observacoes",
  "como_soube",
] as const;

export type CampoInscricao = (typeof CAMPOS_INSCRICAO)[number];

export type ValoresInscricao = Record<CampoInscricao, string>;
export type ErrosInscricao = Partial<Record<CampoInscricao, string>>;

export type DadosInscricao = {
  nome_completo: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  sexo: string | null;
  cidade: string | null;
  nome_contato_emergencia: string | null;
  telefone_contato_emergencia: string | null;
  observacoes: string | null;
  como_soube: string | null;
};

/** O formulário tem duas etapas, então o estado carrega os campos das duas. */
export type CampoFormulario = CampoInscricao | CampoPagamento;
export type ErrosFormulario = Partial<Record<CampoFormulario, string>>;
export type ValoresFormulario = Partial<Record<CampoFormulario, string>>;

export type EstadoInscricao =
  | { status: "inicial" }
  | {
      status: "erro";
      erros: ErrosFormulario;
      valores: ValoresFormulario;
      mensagem?: string;
      /** Em qual etapa estão os erros, para o formulário voltar até eles. */
      etapa: 1 | 2;
    }
  | { status: "sucesso"; nome: string };

export const ESTADO_INICIAL: EstadoInscricao = { status: "inicial" };

export const OPCOES_SEXO = ["feminino", "masculino", "outro"] as const;

export const STATUS_INSCRICAO = ["pendente", "confirmada", "cancelada"] as const;
export type StatusInscricao = (typeof STATUS_INSCRICAO)[number];

export const OPCOES_COMO_SOUBE = [
  "Amigo ou familiar",
  "Célula",
  "Culto",
  "Redes sociais",
  "Outro",
] as const;

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

/** Guarda o telefone só com dígitos (DDD + número), para o painel filtrar sem depender da máscara. */
function normalizarTelefone(valor: string) {
  return apenasDigitos(valor);
}

function telefoneValido(valor: string) {
  const digitos = apenasDigitos(valor);
  return digitos.length === 10 || digitos.length === 11;
}

function opcional(valor: string) {
  return valor.length > 0 ? valor : null;
}

export function lerValores(formData: FormData): ValoresInscricao {
  return CAMPOS_INSCRICAO.reduce((acumulado, campo) => {
    acumulado[campo] = ((formData.get(campo) as string | null) ?? "").trim();
    return acumulado;
  }, {} as ValoresInscricao);
}

export function validarInscricao(valores: ValoresInscricao): {
  erros: ErrosInscricao;
  dados: DadosInscricao;
} {
  const erros: ErrosInscricao = {};

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

  if (valores.sexo && !OPCOES_SEXO.includes(valores.sexo as (typeof OPCOES_SEXO)[number])) {
    erros.sexo = "Escolha uma das opções.";
  }

  if (
    valores.telefone_contato_emergencia &&
    !telefoneValido(valores.telefone_contato_emergencia)
  ) {
    erros.telefone_contato_emergencia = "Informe o telefone com DDD.";
  }

  if (valores.observacoes.length > 1000) {
    erros.observacoes = "Texto muito longo. Resuma em até 1000 caracteres.";
  }

  return {
    erros,
    dados: {
      nome_completo: valores.nome_completo,
      email: valores.email.toLowerCase(),
      telefone: normalizarTelefone(valores.telefone),
      data_nascimento: valores.data_nascimento,
      sexo: opcional(valores.sexo),
      cidade: opcional(valores.cidade),
      nome_contato_emergencia: opcional(valores.nome_contato_emergencia),
      telefone_contato_emergencia: valores.telefone_contato_emergencia
        ? normalizarTelefone(valores.telefone_contato_emergencia)
        : null,
      observacoes: opcional(valores.observacoes),
      como_soube: opcional(valores.como_soube),
    },
  };
}
