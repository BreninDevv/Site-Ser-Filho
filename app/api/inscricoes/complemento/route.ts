import { NextResponse } from "next/server";
import { processarComplementoPagamento } from "@/lib/completar-pagamento";
import { formDataDeJson } from "@/lib/inscricoes/http";

export const runtime = "nodejs";

const ERRO = {
  status: "erro" as const,
  mensagem: "Não foi possível enviar o complemento. Tente de novo.",
};

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as { origem?: string };
    const origem = json.origem === "legado" ? "legado" : "encontro";
    const resultado = await processarComplementoPagamento(
      origem,
      formDataDeJson(json)
    );
    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json(ERRO);
  }
}
