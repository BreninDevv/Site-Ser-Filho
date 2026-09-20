import { NextResponse } from "next/server";
import { obterPerfilAtual, podeGerenciarMidia } from "@/lib/auth/permissoes";
import { obterPreviaDoLink } from "@/lib/testemunho-previa";

export async function POST(request: Request) {
  const perfil = await obterPerfilAtual();
  if (!podeGerenciarMidia(perfil)) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  }

  const url = String(body.url ?? "").trim();
  if (!url) {
    return NextResponse.json({ erro: "Cole o link do vídeo." }, { status: 400 });
  }

  const resultado = await obterPreviaDoLink(url);
  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro }, { status: 422 });
  }

  return NextResponse.json({
    plataforma: resultado.plataforma,
    rotulo: resultado.rotulo,
    destino: resultado.destino,
    thumbnailUrl: resultado.thumbnailUrl,
  });
}
