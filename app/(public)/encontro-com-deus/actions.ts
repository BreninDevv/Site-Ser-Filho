"use server";

import { createClient } from "@/lib/supabase/server";
import {
  lerValores,
  validarInscricao,
  type EstadoInscricao,
} from "@/lib/validations/inscricao-encontro";

export async function inscreverNoEncontro(
  _estadoAnterior: EstadoInscricao,
  formData: FormData
): Promise<EstadoInscricao> {
  const valores = lerValores(formData);
  const { erros, dados } = validarInscricao(valores);

  if (Object.keys(erros).length > 0) {
    return { status: "erro", erros, valores };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("inscricoes_encontro").insert(dados);

  if (error) {
    return {
      status: "erro",
      erros: {},
      valores,
      mensagem:
        "Não foi possível enviar sua inscrição agora. Tente novamente em alguns instantes.",
    };
  }

  return { status: "sucesso", nome: dados.nome_completo };
}
