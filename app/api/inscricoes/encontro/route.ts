import { NextResponse } from "next/server";
import { processarInscricaoEncontro } from "@/lib/inscricoes/encontro";
import { formDataDeJson } from "@/lib/inscricoes/http";

export const runtime = "nodejs";

const ERRO: Awaited<ReturnType<typeof processarInscricaoEncontro>> = {
  status: "erro",
  erros: {},
  valores: {},
  etapa: 2,
  mensagem:
    "Não foi possível enviar sua inscrição agora. Tente novamente em alguns instantes.",
};

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const resultado = await processarInscricaoEncontro(formDataDeJson(json));
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json(ERRO);
  }
}
