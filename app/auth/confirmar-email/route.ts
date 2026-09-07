import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { tipoOtpSeguro } from "@/lib/seguranca";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/email-confirmado", url.origin));
    }
  }

  const tipo = tipoOtpSeguro(type);
  if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({
      type: tipo,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL("/email-confirmado", url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?erro=email_nao_confirmado", url.origin));
}
