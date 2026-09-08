"use server";

import { processarInscricaoEncontro } from "@/lib/inscricoes/encontro";
import type { EstadoInscricao } from "@/lib/validations/inscricao-encontro";

export async function inscreverNoEncontro(
  _estadoAnterior: EstadoInscricao,
  formData: FormData
): Promise<EstadoInscricao> {
  return processarInscricaoEncontro(formData);
}
