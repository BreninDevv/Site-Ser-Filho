import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const nextBruto = url.searchParams.get("next") ?? "/redefinir-senha";
  const destino = nextBruto.startsWith("/") ? nextBruto : "/redefinir-senha";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(destino, url.origin));
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as "recovery" | "signup" | "email" | "magiclink" | "invite" | "email_change",
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
