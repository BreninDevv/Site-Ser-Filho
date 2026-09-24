import { NextResponse } from "next/server";

import { COOKIE_VISITANTE } from "@/lib/auth/visitante";

function destinoSeguro(origem: URL, next: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return new URL(next, origem.origin);
  }
  return new URL("/inicio", origem.origin);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const destino = destinoSeguro(url, url.searchParams.get("next"));
  const resposta = NextResponse.redirect(destino);

  resposta.cookies.set(COOKIE_VISITANTE, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return resposta;
}
