import { NextResponse } from "next/server";
import { processarInscricaoEvento } from "@/lib/inscricoes/evento";
import { formDataDeJson } from "@/lib/inscricoes/http";

export const runtime = "nodejs";

const ERRO: Awaited<ReturnType<typeof processarInscricaoEvento>> = {
  status: "erro",
  erros: {},
  mensagem: "Não foi possível enviar sua inscrição agora. Tente novamente.",
};

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as { evento_id?: string };
    const eventoId = String(json.evento_id ?? "");
    const resultado = await processarInscricaoEvento(
      eventoId,
      formDataDeJson(json)
    );
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json(ERRO);
  }
}
