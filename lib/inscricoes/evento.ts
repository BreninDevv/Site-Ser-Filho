import { createClient } from "@/lib/supabase/server";
import {
  validarInscricaoEvento,
  type EstadoInscricaoEvento,
} from "@/lib/validations/inscricao-evento";
import {
  caminhoArquivoValido,
  dentroDoLimite,
  ehHoneypot,
  ipDoPedido,
  uuidValido,
} from "@/lib/seguranca";

export async function processarInscricaoEvento(
  eventoId: string,
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
          "Não foi possível enviar sua inscrição agora. Tente novamente.",
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
