export type EstadoComplemento =
  | { status: "inicial" }
  | { status: "sucesso" }
  | { status: "erro"; mensagem: string };

export const ESTADO_COMPLEMENTO_INICIAL: EstadoComplemento = { status: "inicial" };
