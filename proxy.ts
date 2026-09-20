import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_VISITANTE } from "@/lib/auth/visitante";
import { destinoDoPainel, podeAcessarRotaPainel } from "@/lib/auth/roles";

const ROTAS_PUBLICAS = [
  "/login",
  "/cadastro",
  "/esqueci-senha",
  "/redefinir-senha",
  "/email-confirmado",
  "/auth",
  "/api",
];

function ehRotaPublica(pathname: string) {
  return ROTAS_PUBLICAS.some(
    (rota) => pathname === rota || pathname.startsWith(`${rota}/`)
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPainelRoute = pathname.startsWith("/painel");
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/cadastro" ||
    pathname.startsWith("/cadastro/");
  const ehVisitante = request.cookies.get(COOKIE_VISITANTE)?.value === "1";

  if (!user && !ehVisitante && !ehRotaPublica(pathname)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/inicio", request.url));
  }

  if (isPainelRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: perfil } = await supabase
      .from("perfis")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!podeAcessarRotaPainel(perfil?.role, pathname)) {
      return NextResponse.redirect(
        new URL(destinoDoPainel(perfil?.role) ?? "/inicio", request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|html)$).*)",
  ],
};
