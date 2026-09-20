import { type StatusInscricao } from "@/lib/validations/inscricao-encontro";

export type EstadoConsultaPagamento =
  | { status: "inicial" }
  | { status: "vazio"; mensagem: string }
  | { status: "erro"; mensagem: string }
  | { status: "ok"; pagamento: StatusInscricao };

export const ESTADO_INICIAL_CONSULTA: EstadoConsultaPagamento = {
  status: "inicial",
};
