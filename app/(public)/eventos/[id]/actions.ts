"use server";

import { createClient } from "@/lib/supabase/server";
import {
  ESTADO_INICIAL_EVENTO,
  validarInscricaoEvento,
  type EstadoInscricaoEvento,
} from "@/lib/validations/inscricao-evento";
import { STATUS_INSCRICAO, type StatusInscricao } from "@/lib/validations/inscricao-encontro";
import {
  caminhoArquivoValido,
  dentroDoLimite,
  ehHoneypot,
  ipDoPedido,
  uuidValido,
} from "@/lib/seguranca";

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
  try {
    if (ehHoneypot(formData)) {
      return { status: "sucesso", nome: "Inscrição" };
    }
    if (!uuidValido(eventoId)) {
      return { status: "erro", erros: {}, mensagem: "Evento inválido." };
    }

    const ip = await ipDoPedido();
    if (!dentroDoLimite(`inscricao-evento:${ip}`, 8, 10 * 60 * 1000)) {
      return {
        status: "erro",
        erros: {},
        mensagem: "Muitas tentativas. Espere alguns minutos e tente de novo.",
      };
    }

    const validado = validarInscricaoEvento({
      nome: String(formData.get("nome") ?? ""),
      idade: String(formData.get("idade") ?? ""),
      forma: String(formData.get("forma_pagamento") ?? ""),
      comprovante: String(formData.get("comprovante_path") ?? "") || null,
    });

    if (Object.keys(validado.erros).length > 0) {
      return { status: "erro", erros: validado.erros };
    }

    if (!caminhoArquivoValido(validado.dados.comprovante_path)) {
      return {
        status: "erro",
        erros: { comprovante_path: "Comprovante inválido. Envie de novo." },
      };
    }

    const supabase = await createClient();
    const agora = new Date().toISOString();
    const { data: evento } = await supabase
      .from("eventos")
      .select("id, exige_inscricao, publicar_em")
      .eq("id", eventoId)
      .lte("publicar_em", agora)
      .maybeSingle();

    if (!evento?.exige_inscricao) {
      return {
        status: "erro",
        erros: {},
        mensagem: "Este evento não está com inscrição aberta.",
      };
    }

    const { error } = await supabase.from("inscricoes_evento").insert({
      evento_id: eventoId,
      nome: validado.dados.nome,
      idade: validado.dados.idade,
      forma_pagamento: validado.dados.forma_pagamento,
      comprovante_path: validado.dados.comprovante_path,
    });

    if (error) {
      return {
        status: "erro",
        erros: {},
        mensagem:
          error.message ||
          "Não foi possível enviar. Rode supabase/migrations/009_inscricoes_evento.sql no Supabase.",
      };
    }

    return { status: "sucesso", nome: validado.dados.nome };
  } catch {
    return {
      status: "erro",
      erros: {},
      mensagem: "Não foi possível enviar sua inscrição agora. Tente novamente.",
    };
  }
}

export { ESTADO_INICIAL_EVENTO };
