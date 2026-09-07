import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { destinoPosAuth, tipoOtpSeguro } from "@/lib/seguranca";

/**
 * O e-mail do Supabase volta com um `code` (PKCE). Sem esta rota, o código
 * nunca vira sessão: a página de nova senha abre “vazia” e o updateUser
 * falha com a mensagem de link expirado.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const destino = destinoPosAuth(url.searchParams.get("next"));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(destino, url.origin));
    }
  }

  const tipo = tipoOtpSeguro(type);
  if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({
      type: tipo,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(destino, url.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/esqueci-senha?erro=link_invalido", url.origin)
  );
}
