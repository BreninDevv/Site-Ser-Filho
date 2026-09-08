"use server";

import { processarInscricaoLegado } from "@/lib/inscricoes/legado";
import type { EstadoInscricaoLegado } from "@/lib/validations/inscricao-legado";

export async function inscreverNoLegado(
  _estadoAnterior: EstadoInscricaoLegado,
  formData: FormData
): Promise<EstadoInscricaoLegado> {
  return processarInscricaoLegado(formData);
}
