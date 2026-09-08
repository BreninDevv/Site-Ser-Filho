"use server";

import { createClient } from "@/lib/supabase/server";
import { processarInscricaoEvento } from "@/lib/inscricoes/evento";
import {
  ESTADO_INICIAL_EVENTO,
  type EstadoInscricaoEvento,
} from "@/lib/validations/inscricao-evento";
import { STATUS_INSCRICAO, type StatusInscricao } from "@/lib/validations/inscricao-encontro";
import { dentroDoLimite, ipDoPedido, uuidValido } from "@/lib/seguranca";

export type EstadoConsultaPagamento =
  | { status: "inicial" }
  | { status: "vazio"; mensagem: string }
  | { status: "erro"; mensagem: string }
  | { status: "ok"; pagamento: StatusInscricao };

export const ESTADO_INICIAL_CONSULTA: EstadoConsultaPagamento = {
  status: "inicial",
};

export async function consultarStatusPagamentoEvento(
  eventoId: string,
  _anterior: EstadoConsultaPagamento,
  formData: FormData
): Promise<EstadoConsultaPagamento> {
  if (!uuidValido(eventoId)) {
    return { status: "erro", mensagem: "Evento inválido." };
  }

  const ip = await ipDoPedido();
  if (!dentroDoLimite(`status-evento:${ip}`, 20, 10 * 60 * 1000)) {
    return {
      status: "erro",
      mensagem: "Muitas consultas. Espere alguns minutos e tente de novo.",
    };
  }

  const nome = String(formData.get("nome") ?? "").trim().slice(0, 80);
  const idade = Number(String(formData.get("idade") ?? ""));
  if (nome.length < 3 || !nome.includes(" ")) {
    return { status: "erro", mensagem: "Informe o nome completo usado na inscrição." };
  }
  if (!Number.isInteger(idade) || idade < 1 || idade > 120) {
    return { status: "erro", mensagem: "Informe a idade usada na inscrição." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      status: "erro",
      mensagem: "Entre na sua conta para ver o status do pagamento.",
    };
  }

  const { data, error } = await supabase.rpc("status_pagamento_evento", {
    p_evento_id: eventoId,
    p_nome: nome,
    p_idade: idade,
  });

  if (error) {
    return {
      status: "erro",
      mensagem:
        "Não foi possível consultar. Rode supabase/migrations/013_status_pagamento_evento.sql no Supabase.",
    };
  }

  if (!data || !STATUS_INSCRICAO.includes(data as StatusInscricao)) {
    return {
      status: "vazio",
      mensagem: "Não achamos inscrição com esse nome e idade neste evento.",
    };
  }

  return { status: "ok", pagamento: data as StatusInscricao };
}

export async function inscreverNoEvento(
  eventoId: string,
  _anterior: EstadoInscricaoEvento,
  formData: FormData
): Promise<EstadoInscricaoEvento> {
  return processarInscricaoEvento(eventoId, formData);
}

export { ESTADO_INICIAL_EVENTO };
